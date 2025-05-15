export interface EscrowRecord {
  txid: string
  outputIndex: number
  maxAllowedBids: number
  minBidAmount: number
  escrowServicePercent: number
  escrowMustBeFullyDecisive: boolean
  bountySolversNeedApproval: boolean
  approvedFurnisherBondMode: 'forbidden' | 'optional' | 'required'
  requiredFurnisherBondAmount: number
  maxFurnisherBondPostWorkStartDelay: number
  maxSeekerPayoutApprovalTime: number
  maxWorkDeadline: number
  approvalMode: 'seeker' | 'seeker-or-platform' | 'platform'
  contractType: 'bid' | 'bounty'
  bountyAmount?: number
  bids?: Array<{
    furnisherKey: string
    plans: number[]
    bidAmount: number
    bond: number
  }>
  acceptedBid?: number
  seekerKey: string
  platformKey: string
  furnisherKey?: string
  workDescriptor: number[]
  workCompletionDescriotpr: number[]
  state: 'initial' | 'bid-accepted' | 'active-work' | 'submitted-work' | 'resolved' | 'disputed-by-seeker' | 'disputed-by-furnisher'
}

export interface UTXOReference {
  txid: string
  outputIndex: number
}