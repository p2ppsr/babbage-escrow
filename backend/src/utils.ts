import { EscrowRecord } from "./constants.js"
import { EscrowContract } from "./contracts/Escrow.js"

export const recordFromContract = (txid: string, outputIndex: number, escrow: EscrowContract): EscrowRecord => ({
    txid,
    outputIndex,
    minAllowableBid: Number(escrow.minAllowableBid),
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
    bountyIncreaseCutoffPoint: escrow.bountyIncreaseCutoffPoint === EscrowContract.INCREASE_CUTOFF_BID_ACCEPTANCE ? 'bid-acceptance'
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
