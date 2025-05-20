import {
  LookupService,
  LookupQuestion,
  LookupAnswer,
  LookupFormula,
  OutputSpent,
  OutputAdmittedByTopic,
  AdmissionMode,
  SpendNotificationMode
} from '@bsv/overlay'
import { EscrowStorage } from './EscrowStorage.js'
import { Script, Utils } from '@bsv/sdk'
import docs from './EscrowLookupDocs.md.js'
import escrowContractJson from '../../artifacts/Escrow.json' with { type: 'json' }
import { EscrowContract } from '../contracts/Escrow.js'
import { Db } from 'mongodb'
import { EscrowRecord } from '../constants.js'
EscrowContract.loadArtifact(escrowContractJson)

/**
 * Implements an Escrow lookup service
 *
 * Note: The sCrypt contract is used to decode Escrow outputs.
 *
 * @public
 */
class EscrowLookupService implements LookupService {
  readonly admissionMode: AdmissionMode = 'locking-script'
  readonly spendNotificationMode: SpendNotificationMode = 'none'
  constructor(public storage: EscrowStorage) {}

  async outputAdmittedByTopic(payload: OutputAdmittedByTopic): Promise<void> {
    if (payload.mode !== 'locking-script') throw new Error('Invalid payload')
    const { topic, txid, outputIndex, lockingScript } = payload
    if (topic !== 'tm_meter') return
    try {
      // Decode the Escrow token fields from the Bitcoin outputScript with the contract class
      const escrow = EscrowContract.fromLockingScript(
        lockingScript.toHex()
      ) as EscrowContract

      // Store the token fields for future lookup
      await this.storage.storeRecord({
        txid,
        outputIndex,
        minAllowableBid: Number(escrow.minAllowableBid),
        maxAllowedBids: Number(escrow.maxAllowedBids),
        escrowServiceFeeBasisPoints: Number(escrow.escrowServiceFeeBasisPoints),
        platformAuthorizationRequired: escrow.platformAuthorizationRequired === 1n,
        escrowMustBeFullyDecisive: escrow.escrowMustBeFullyDecisive === 1n,
        bountySolversNeedApproval: escrow.bountySolversNeedApproval === 1n,
        furnisherBondingMode:
          escrow.furnisherBondingMode === EscrowContract.FURNISHER_BONDING_MODE_FORBIDDEN ? 'forbidden'
          : escrow.furnisherBondingMode === EscrowContract.FURNISHER_BONDING_MODE_OPTIONAL ?  'optional'
          : 'required',
        requiredBondAmount: Number(escrow.requiredBondAmount),
        maxWorkStartDelay: Number(escrow.maxWorkStartDelay),
        maxWorkApprovalDelay: Number(escrow.maxWorkApprovalDelay),
        delayUnit: escrow.delayUnit === EscrowContract.DELAY_UNIT_BLOCKS ? 'blocks'
          : 'seconds',
        workCompletionDeadline: Number(escrow.workCompletionDeadline),
        approvalMode: escrow.approvalMode === EscrowContract.FURNISHER_APPROVAL_MODE_SEEKER ? 'seeker'
          : escrow.approvalMode === EscrowContract.FURNISHER_APPROVAL_MODE_PLATFORM ?'platform'
          : 'seeker-or-platform',
        contractType: escrow.contractType === EscrowContract.TYPE_BID ? 'bid'
          : 'bounty',
        contractSurvivesAdverseFurnisherDisputeResolution:
          escrow.contractSurvivesAdverseFurnisherDisputeResolution === 1n,
        bountyIncreaseAllowanceMode: escrow.bountyIncreaseAllowanceMode === EscrowContract.BOUNTY_INCREASE_FORBIDDEN ? 'forbidden'
          : escrow.bountyIncreaseAllowanceMode === EscrowContract.BOUNTY_INCREASE_ALLOWED_BY_SEEKER ? 'by-seeker'
          : escrow.bountyIncreaseAllowanceMode === EscrowContract.BOUNTY_INCREASE_ALLOWED_BY_PLATFORM ? 'by-platform'
          : escrow.bountyIncreaseAllowanceMode === EscrowContract.BOUNTY_INCREASE_ALLOWED_BY_SEEKER_OR_PLATFORM ? 'by-seeker-or-platform'
          : 'by-anyone',
        bountyIncreaseCutoffPoint: escrow.bountyIncreaseCutoffPoint === EscrowContract.INCREASE_CUTOFF_BID_ACCEPTANCE ? 'bit-acceptance'
          : escrow.bountyIncreaseCutoffPoint === EscrowContract.INCREASE_CUTOFF_START_OF_WORK ? 'start-of-work'
          : escrow.bountyIncreaseCutoffPoint === EscrowContract.INCREASE_CUTOFF_SUBMISSION_OF_WORK ? 'submission-of-work'
          :  'acceptance-of-work',
        bids: escrow.bids.values().toArray().map(x => ({
          furnisherKey: x.furnisherKey.toString(),
          plans: x.plans.toString(),
          bidAmount: Number(x.bidAmount),
          bond: Number(x.bond),
          timeOfBid: Number(x.timeOfBid),
          timeRequired: Number(x.timeRequired)
        })),
        seekerKey: escrow.seekerKey,
        platformKey: escrow.platformKey,
        acceptedBid: {
          furnisherKey: escrow.acceptedBid.furnisherKey.toString(),
          plans: escrow.acceptedBid.plans.toString(),
          bidAmount: Number(escrow.acceptedBid.bidAmount),
          bond: Number(escrow.acceptedBid.bond),
          timeOfBid: Number(escrow.acceptedBid.timeOfBid),
          timeRequired: Number(escrow.acceptedBid.timeRequired)
        },
        bidAcceptedBy: escrow.bidAcceptedBy === EscrowContract.BID_ACCEPTED_BY_PLATFORM ? 'platform'
          : escrow.bidAcceptedBy === EscrowContract.BID_ACCEPTED_BY_SEEKER ? 'seeker'
          : 'not-yet-accepted',
        workCompletionTime: Number(escrow.workCompletionTime),
        status: escrow.status === EscrowContract.STATUS_INITIAL ? 'initial'
          : escrow.status === EscrowContract.STATUS_BID_ACCEPTED ? 'bid-accepted'
          : escrow.status === EscrowContract.STATUS_WORK_STARTED ? 'work-started'
          : escrow.status === EscrowContract.STATUS_WORK_SUBMITTED ? 'work-submitted'
          : escrow.status === EscrowContract.STATUS_RESOLVED ? 'resolved'
          : escrow.status === EscrowContract.STATUS_DISPUTED_BY_SEEKER ? 'disputed-by-seeker'
          : 'disputed-by-furnisher',
        workDescription: escrow.workDescription.toString(),
        workCompletionDescription: escrow.workCompletionDescription.toString()
      })
    } catch (e) {
      console.error('Error indexing token in lookup database', e)
      return
    }
  }

  async outputSpent(payload: OutputSpent): Promise<void> {
    if (payload.mode !== 'none') throw new Error('Invalid payload')
    const { topic, txid, outputIndex } = payload
    if (topic !== 'tm_meter') return
    await this.storage.deleteRecord(txid, outputIndex)
  }

  async outputEvicted(
    txid: string,
    outputIndex: number
  ): Promise<void> {
    await this.storage.deleteRecord(txid, outputIndex)
  }

  async lookup(
    question: LookupQuestion
  ): Promise<LookupAnswer | LookupFormula> {
    if (question.query === undefined || question.query === null) {
      throw new Error('A valid query must be provided!')
    }
    if (question.service !== 'ls_meter') {
      throw new Error('Lookup service not supported!')
    }

    const query = question.query as {
      findAll?: boolean
    }
    if (query.findAll) {
      return await this.storage.findAll()
    }
    const mess = JSON.stringify(question, null, 2)
    throw new Error(`question.query:${mess}}`)
  }

  async getDocumentation(): Promise<string> {
    return docs
  }

  async getMetaData(): Promise<{
    name: string
    shortDescription: string
    iconURL?: string
    version?: string
    informationURL?: string
  }> {
    return {
      name: 'Escrow Lookup Service',
      shortDescription: 'Tracks escrow contract UTXOs.'
    }
  }
}

export default (db: Db): EscrowLookupService => {
  return new EscrowLookupService(new EscrowStorage(db))
}
