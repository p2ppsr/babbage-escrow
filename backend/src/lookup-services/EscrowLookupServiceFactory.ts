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
import docs from './EscrowLookupDocs.md.js'
import escrowContractJson from '../../artifacts/Escrow.json' with { type: 'json' }
import { EscrowContract } from '../contracts/Escrow.js'
import { Db } from 'mongodb'
EscrowContract.loadArtifact(escrowContractJson)
import { recordFromContract } from '../utils.js'

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
      await this.storage.storeRecord(recordFromContract(txid, outputIndex, escrow))
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
