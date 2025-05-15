import {
    assert,
    ByteString,
    hash256,
    method,
    prop,
    SmartContract,
    SigHash,
    PubKey,
    FixedArray,
    HashedSet
} from 'scrypt-ts'

/*

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
    time: number
  }>
  acceptedBid?: number
  seekerKey: string
  platformKey: string
  furnisherKey?: string
  workDescriptor: number[]
  workCompletionDescriotpr: number[]
  workCompletionTime: number
  state: 'initial' | 'bid-accepted' | 'active-work' | 'submitted-work' | 'resolved' | 'disputed-by-seeker' | 'disputed-by-furnisher'
}

*/

export type Bid = {
    furnisherKey: PubKey
    plans: ByteString
    bidAmount: bigint
    bond: bigint
    timeOfBid: bigint
}

export class EscrowContract extends SmartContract {
    // Contract types
    static readonly TYPE_BOND: bigint = 1n
    static readonly TYPE_BID: bigint = 2n

    // Contract states
    static readonly STATE_INITIAL: bigint = 11n
    static readonly STATE_BID_ACCEPTED: bigint = 12n
    static readonly STATE_WORK_STARTED: bigint = 13n
    static readonly STATE_WORK_SUBMITTED: bigint = 14n
    static readonly STATE_RESOLVED: bigint = 15n
    static readonly STATE_DISPUTED_BY_SEEKER: bigint = 21n
    static readonly STATE_DISPUTED_BY_FURNISHER: bigint = 22n

    // Furnisher bonding modes
    static readonly FURNISHER_BONDING_MODE_FORBIDDEN: bigint = 31n
    static readonly FURNISHER_BONDING_MODE_OPTIONAL: bigint = 32n
    static readonly FURNISHER_BONDING_MODE_REQUIRED: bigint = 33n

    // Furnisher selection and approval modes
    static readonly FURNISHER_APPROVAL_MODE_SEEKER: bigint = 41n
    static readonly FURNISHER_APPROVAL_MODE_SEEKER_OR_PLATFORM: bigint = 42n
    static readonly FURNISHER_APPROVAL_MODE_PLATFORM: bigint = 43n

    @prop(true)
    minAllowableBid: bigint

    @prop(true)
    maxAllowedBids: bigint

    @prop(true)
    escrowServicePercent: bigint

    @prop(true)
    escrowMustBeFullyDecisive: bigint

    @prop(true)
    bountySolversNeedApproval: bigint

    @prop(true)
    furnisherBondingMode: bigint

    @prop(true)
    requiredBondAmount: bigint

    @prop(true)
    maxWorkStartDelay: bigint

    @prop(true)
    maxWorkApprovalDelay: bigint

    @prop(true)
    workCompletionDeadline: bigint

    @prop(true)
    approvalMode: bigint

    @prop(true)
    contractType: bigint

    @prop(true)
    bids: HashedSet<Bid>

    @prop(true)
    seekerKey: PubKey

    @prop(true)
    platformKey: PubKey

    @prop(true)
    furnisherKey: PubKey | null

    @prop(true)
    workCompletionTime: bigint | null

    @prop(true)
    state: bigint

    @prop(true)
    workDescription: ByteString

    @prop(true)
    workCompletionDescription: ByteString | null

    constructor(
        minAllowableBid: bigint,
        maxAllowedBids: bigint,
        escrowServicePercent: bigint,
        escrowMustBeFullyDecisive: bigint,
        bountySolversNeedApproval: bigint,
        furnisherBondingMode: bigint,
        requiredBondAmount: bigint,
        maxWorkStartDelay: bigint,
        maxWorkApprovalDelay: bigint,
        workCompletionDeadline: bigint,
        approvalMode: bigint,
        contractType: bigint,
        seekerKey: PubKey,
        platformKey: PubKey,
        workDescription: ByteString
    ) {
        super(...arguments)

        // Required values in all contracts
        this.seekerKey = seekerKey // Who are you?
        this.platformKey = platformKey // What platform are you using?
        this.escrowServicePercent = escrowServicePercent // What do they charge?
        this.workDescription = workDescription // What do you want done?
        this.workCompletionDeadline = workCompletionDeadline // When do you need it by?

        // Optional values
        this.minAllowableBid = minAllowableBid // What's the minimum bid?
        this.maxAllowedBids = maxAllowedBids // How many bids max?
        
        // Contract configuration
        this.bountySolversNeedApproval = bountySolversNeedApproval // Can someone start work without talking to anyone, and the first one done gets the money?
        this.escrowMustBeFullyDecisive = escrowMustBeFullyDecisive // if people mess up, is escrow forced to make an all-or-nothing award?
        this.furnisherBondingMode = furnisherBondingMode // Can bidders offer up collateral for in case they mess up? Is this required?
        this.requiredBondAmount = requiredBondAmount // How much collateral does a bidder need to offer up if this is required? Or if it's a race.
        this.maxWorkStartDelay = maxWorkStartDelay // How long after you accept a bid before the worker needs to post up bond and get started, or else get replaced?
        this.maxWorkApprovalDelay = maxWorkApprovalDelay // After they finish, how long do you have to look at the work before they can file a dispute?
        this.approvalMode = approvalMode // Who can approve a worker to start work? You, the platform, or either/or?
        this.contractType = contractType // Are you putting up a fixed bounty for this work or accepting bids at different prices to get it done?

        // State starts at initial, with no bids
        this.state = EscrowContract.STATE_INITIAL
        this.bids = new HashedSet()

        // Non-initial values are null
        this.furnisherKey = null
        this.workCompletionTime = null
        this.workCompletionDescription = null
    }

    @method(SigHash.ANYONECANPAY_SINGLE)
    public incrementOnChain() {
        // Increment counter value
        this.increment()

        // make sure balance in the contract does not change
        const amount: bigint = this.ctx.utxo.value
        // outputs containing the latest state and an optional change output
        const outputs: ByteString = this.buildStateOutput(amount)
        // verify unlocking tx has the same outputs
        assert(this.ctx.hashOutputs == hash256(outputs), 'hashOutputs mismatch')
    }

    @method()
    increment(): void {
        this.count++
    }

    @method(SigHash.ANYONECANPAY_SINGLE)
    public decrementOnChain() {
        // Increment counter value
        this.decrement()

        // make sure balance in the contract does not change
        const amount: bigint = this.ctx.utxo.value
        // outputs containing the latest state and an optional change output
        const outputs: ByteString = this.buildStateOutput(amount)
        // verify unlocking tx has the same outputs
        assert(this.ctx.hashOutputs == hash256(outputs), 'hashOutputs mismatch')
    }

    @method()
    decrement(): void {
        this.count--
    }
}