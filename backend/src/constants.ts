export interface Bid {
    furnisherKey: string
    plans: string
    bidAmount: number
    bond: number
    timeOfBid: number
    timeRequired: number
}

export interface EscrowRecord {
  txid: string
  outputIndex: number
  minAllowableBid: number
  maxAllowedBids: number
  escrowServiceFeeBasisPoints: number
  platformAuthorizationRequired: boolean
  escrowMustBeFullyDecisive: boolean
  bountySolversNeedApproval: boolean
  furnisherBondingMode: 'forbidden' | 'optional' | 'required'
  requiredBondAmount: number
  maxWorkStartDelay: number
  maxWorkApprovalDelay: number
  delayUnit: 'blocks' | 'seconds'
  workCompletionDeadline: number
  approvalMode: 'seeker' | 'platform' | 'seeker-or-platform'
  contractType: 'bid' | 'bounty'
  contractSurvivesAdverseFurnisherDisputeResolution: boolean
  bountyIncreaseAllowanceMode: 'forbidden' | 'by-seeker' | 'by-platform' | 'by-seeker-or-platform' | 'by-anyone'
  bountyIncreaseCutoffPoint: 'bit-acceptance' | 'start-of-work' | 'submission-of-work' | 'acceptance-of-work'
  bids: Array<Bid>
  seekerKey: string
  platformKey: string
  acceptedBid: Bid
  bidAcceptedBy: 'platform' | 'seeker' | 'not-yet-accepted'
  workCompletionTime: number
  status: 'initial' | 'bid-accepted' | 'work-started' | 'work-submitted' | 'resolved' | 'disputed-by-seeker' | 'disputed-by-furnisher'
  workDescription: string
  workCompletionDescription: string
}

export interface UTXOReference {
  txid: string
  outputIndex: number
}