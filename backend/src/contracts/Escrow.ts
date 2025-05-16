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
    HashedSet,
    Sig
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
    timeRequired: bigint
}

export class EscrowContract extends SmartContract {
    // Contract types
    static readonly TYPE_BOUNTY: bigint = 1n
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

    // Delay units
    static readonly DELAY_UNIT_BLOCKS: bigint = 51n
    static readonly DELAY_UNIT_SECONDS: bigint = 52n

    // Bounty increase allowance modes
    static readonly BOUNTY_INCREASE_FORBIDDEN: bigint = 61n
    static readonly BOUNTY_INCREASE_ALLOWED_BY_SEEKER: bigint = 62n
    static readonly BOUNTY_INCREASE_ALLOWED_BY_PLATFORM: bigint = 63n
    static readonly BOUNTY_INCREASE_ALLOWED_BY_SEEKER_OR_PLATFORM: bigint = 64n
    static readonly BOUNTY_INCREASE_ALLOWED_BY_ANYONE: bigint = 65n

    // Bounty increase cutoff points
    static readonly INCREASE_CUTOFF_BID_ACCEPTANCE: bigint = 71n
    static readonly INCREASE_CUTOFF_START_OF_WORK: bigint = 72n
    static readonly INCREASE_CUTOFF_SUBMISSION_OF_WORK: bigint = 73n
    static readonly INCREASE_CUTOFF_ACCEPTANCE_OF_WORK: bigint = 74n

    // Bid acceptance attribution
    static readonly BID_NOT_YET_ACCEPTED: bigint = 81n
    static readonly BID_ACCEPTED_BY_SEEKER: bigint = 82n
    static readonly BID_ACCEPTED_BY_PLATFORM: bigint = 82n

    @prop(true)
    minAllowableBid: bigint

    @prop(true)
    maxAllowedBids: bigint

    @prop(true)
    escrowServicePercent: bigint

    @prop(true)
    platformAuthorizationRequired: bigint

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
    delayUnit: bigint

    @prop(true)
    workCompletionDeadline: bigint

    @prop(true)
    approvalMode: bigint

    @prop(true)
    contractType: bigint

    @prop(true)
    bountyIncreaseAllowanceMode: bigint

    @prop(true)
    bountyIncreaseCutoffPoint: bigint

    @prop(true)
    bids: HashedSet<Bid>

    @prop(true)
    seekerKey: PubKey

    @prop(true)
    platformKey: PubKey

    @prop(true)
    acceptedBid: Bid | null

    @prop(true)
    bidAcceptedBy: bigint

    @prop(true)
    workCompletionTime: bigint | null

    @prop(true)
    state: bigint

    @prop(true)
    workDescription: ByteString

    @prop(true)
    workCompletionDescription: ByteString | null

    constructor(
        seekerKey: PubKey,
        platformKey: PubKey,
        escrowServicePercent: bigint,
        platformAuthorizationRequired: bigint,
        workDescription: ByteString,
        workCompletionDeadline: bigint,
        minAllowableBid: bigint = 0n,
        maxAllowedBids: bigint = 7n,
        bountySolversNeedApproval: bigint = 1n,
        escrowMustBeFullyDecisive: bigint = 1n,
        furnisherBondingMode: bigint = EscrowContract.FURNISHER_BONDING_MODE_OPTIONAL,
        requiredBondAmount: bigint = 0n,
        maxWorkStartDelay: bigint = 144n,
        maxWorkApprovalDelay: bigint = 144n,
        delayUnit: bigint = EscrowContract.DELAY_UNIT_BLOCKS,
        approvalMode: bigint = EscrowContract.FURNISHER_APPROVAL_MODE_SEEKER,
        bountyIncreaseAllowanceMode: bigint = EscrowContract.BOUNTY_INCREASE_FORBIDDEN,
        bountyIncreaseCutoffPoint: bigint = EscrowContract.INCREASE_CUTOFF_BID_ACCEPTANCE,
        contractType: bigint = EscrowContract.TYPE_BID
    ) {
        super(...arguments)

        // Required values in all contracts
        this.seekerKey = seekerKey // Who are you?
        this.platformKey = platformKey // What platform are you using?
        this.escrowServicePercent = escrowServicePercent // What do they charge?
        this.platformAuthorizationRequired = platformAuthorizationRequired // Must the platform authorize start-of-work?
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
        this.delayUnit = delayUnit // Are times measured in seconds or blocks for this contract?
        this.approvalMode = approvalMode // Who can approve a worker to start work? You, the platform, or either/or?
        this.contractType = contractType // Are you putting up a fixed bounty for this work or accepting bids at different prices to get it done?
        this.bountyIncreaseAllowanceMode = bountyIncreaseAllowanceMode // If this is a bounty contract, who may increase the bounty?
        this.bountyIncreaseCutoffPoint = bountyIncreaseCutoffPoint // When is the latest point where someone may make the bounty higher?

        // State starts at initial, with no bids
        this.state = EscrowContract.STATE_INITIAL
        this.bids = new HashedSet()

        // Non-initial values are null
        this.acceptedBid = null
        this.bidAcceptedBy = EscrowContract.BID_NOT_YET_ACCEPTED
        this.workCompletionTime = null
        this.workCompletionDescription = null
    }

    @method()
    public seekerCancelsBeforeAccept(seekerSig: Sig) {
        assert(this.state === EscrowContract.STATE_INITIAL, "Contract must be in the initial state for a seeker to cancel")
        assert(this.checkSig(seekerSig, this.seekerKey), "Seeker must sign contract cancellation")
    }

    @method(SigHash.ANYONECANPAY_SINGLE)
    public anyoneIncreasesBounty(amount: bigint) {
        assert(amount > 0n)
        assert(this.contractType === EscrowContract.TYPE_BOUNTY)
        assert(this.bountyIncreaseAllowanceMode === EscrowContract.BOUNTY_INCREASE_ALLOWED_BY_ANYONE)

        // Enforce cutoff time
        if (this.bountyIncreaseCutoffPoint === EscrowContract.INCREASE_CUTOFF_BID_ACCEPTANCE) {
            assert(this.state === EscrowContract.STATE_INITIAL)
        } else if (this.bountyIncreaseCutoffPoint === EscrowContract.INCREASE_CUTOFF_START_OF_WORK) {
            assert(
                this.state === EscrowContract.STATE_INITIAL ||
                this.state === EscrowContract.STATE_BID_ACCEPTED
            )
        } else if (this.bountyIncreaseCutoffPoint === EscrowContract.INCREASE_CUTOFF_SUBMISSION_OF_WORK) {
            assert(
                this.state === EscrowContract.STATE_INITIAL ||
                this.state === EscrowContract.STATE_BID_ACCEPTED ||
                this.state === EscrowContract.STATE_WORK_STARTED
            )
        } else if (this.bountyIncreaseCutoffPoint === EscrowContract.INCREASE_CUTOFF_ACCEPTANCE_OF_WORK) {
            assert(
                this.state === EscrowContract.STATE_INITIAL ||
                this.state === EscrowContract.STATE_BID_ACCEPTED ||
                this.state === EscrowContract.STATE_WORK_STARTED ||
                this.state === EscrowContract.STATE_WORK_SUBMITTED
            )
        }

        assert(this.ctx.hashOutputs === hash256(this.buildStateOutput(this.ctx.utxo.value + amount)))
    }

    @method(SigHash.ANYONECANPAY_SINGLE)
    public seekerIncreasesBounty(seekerSig: Sig, amount: bigint) {
        assert(amount > 0n)
        assert(this.contractType === EscrowContract.TYPE_BOUNTY)
        assert(
            this.bountyIncreaseAllowanceMode === EscrowContract.BOUNTY_INCREASE_ALLOWED_BY_ANYONE ||
            this.bountyIncreaseAllowanceMode === EscrowContract.BOUNTY_INCREASE_ALLOWED_BY_SEEKER ||
            this.bountyIncreaseAllowanceMode === EscrowContract.BOUNTY_INCREASE_ALLOWED_BY_SEEKER_OR_PLATFORM
        )

        // Enforce cutoff time
        if (this.bountyIncreaseCutoffPoint === EscrowContract.INCREASE_CUTOFF_BID_ACCEPTANCE) {
            assert(this.state === EscrowContract.STATE_INITIAL)
        } else if (this.bountyIncreaseCutoffPoint === EscrowContract.INCREASE_CUTOFF_START_OF_WORK) {
            assert(
                this.state === EscrowContract.STATE_INITIAL ||
                this.state === EscrowContract.STATE_BID_ACCEPTED
            )
        } else if (this.bountyIncreaseCutoffPoint === EscrowContract.INCREASE_CUTOFF_SUBMISSION_OF_WORK) {
            assert(
                this.state === EscrowContract.STATE_INITIAL ||
                this.state === EscrowContract.STATE_BID_ACCEPTED ||
                this.state === EscrowContract.STATE_WORK_STARTED
            )
        } else if (this.bountyIncreaseCutoffPoint === EscrowContract.INCREASE_CUTOFF_ACCEPTANCE_OF_WORK) {
            assert(
                this.state === EscrowContract.STATE_INITIAL ||
                this.state === EscrowContract.STATE_BID_ACCEPTED ||
                this.state === EscrowContract.STATE_WORK_STARTED ||
                this.state === EscrowContract.STATE_WORK_SUBMITTED
            )
        }
        
        assert(this.checkSig(seekerSig, this.seekerKey), 'Seeker must sign to increase bounty')
        assert(this.ctx.hashOutputs === hash256(this.buildStateOutput(this.ctx.utxo.value + amount)))
    }

    @method(SigHash.ANYONECANPAY_SINGLE)
    public platformIncreasesBounty(platformSig: Sig, amount: bigint) {
        assert(amount > 0n)
        assert(this.contractType === EscrowContract.TYPE_BOUNTY)
        assert(
            this.bountyIncreaseAllowanceMode === EscrowContract.BOUNTY_INCREASE_ALLOWED_BY_ANYONE ||
            this.bountyIncreaseAllowanceMode === EscrowContract.BOUNTY_INCREASE_ALLOWED_BY_PLATFORM ||
            this.bountyIncreaseAllowanceMode === EscrowContract.BOUNTY_INCREASE_ALLOWED_BY_SEEKER_OR_PLATFORM
        )

        // Enforce cutoff time
        if (this.bountyIncreaseCutoffPoint === EscrowContract.INCREASE_CUTOFF_BID_ACCEPTANCE) {
            assert(this.state === EscrowContract.STATE_INITIAL)
        } else if (this.bountyIncreaseCutoffPoint === EscrowContract.INCREASE_CUTOFF_START_OF_WORK) {
            assert(
                this.state === EscrowContract.STATE_INITIAL ||
                this.state === EscrowContract.STATE_BID_ACCEPTED
            )
        } else if (this.bountyIncreaseCutoffPoint === EscrowContract.INCREASE_CUTOFF_SUBMISSION_OF_WORK) {
            assert(
                this.state === EscrowContract.STATE_INITIAL ||
                this.state === EscrowContract.STATE_BID_ACCEPTED ||
                this.state === EscrowContract.STATE_WORK_STARTED
            )
        } else if (this.bountyIncreaseCutoffPoint === EscrowContract.INCREASE_CUTOFF_ACCEPTANCE_OF_WORK) {
            assert(
                this.state === EscrowContract.STATE_INITIAL ||
                this.state === EscrowContract.STATE_BID_ACCEPTED ||
                this.state === EscrowContract.STATE_WORK_STARTED ||
                this.state === EscrowContract.STATE_WORK_SUBMITTED
            )
        }
        
        assert(this.checkSig(platformSig, this.platformKey), 'Platform must sign to increase bounty')
        assert(this.ctx.hashOutputs === hash256(this.buildStateOutput(this.ctx.utxo.value + amount)))
    }

    @method(SigHash.ANYONECANPAY_SINGLE)
    public seekerExtendsWorkDeadline(seekerSig: Sig, extension: bigint) {
        assert(extension > 0n)
        if (this.delayUnit === EscrowContract.DELAY_UNIT_BLOCKS) {
            assert(this.workCompletionDeadline + extension < 500000000n)
        } else {
            assert(this.workCompletionDeadline + extension > 500000000n)
        }
        assert(
            this.state === EscrowContract.STATE_INITIAL ||
            this.state === EscrowContract.STATE_BID_ACCEPTED ||
            this.state === EscrowContract.STATE_WORK_STARTED
        )
        this.workCompletionDeadline += extension
        assert(this.checkSig(seekerSig, this.seekerKey), 'Seeker must sign to extend deadline')
        assert(this.ctx.hashOutputs === hash256(this.buildStateOutput(this.ctx.utxo.value)))
    }

    @method(SigHash.ANYONECANPAY_SINGLE)
    public furnisherPlacesBid(furnisherSig: Sig, bid: Bid) {
        assert(this.state === EscrowContract.STATE_INITIAL)
        assert(this.bountySolversNeedApproval === 1n)
        assert(this.checkSig(furnisherSig, bid.furnisherKey))
        if (this.contractType === EscrowContract.TYPE_BOUNTY) {
            assert(bid.bidAmount === this.ctx.utxo.value)
        } else {
            assert(bid.bidAmount >= this.minAllowableBid)
        }
        if (this.furnisherBondingMode === EscrowContract.FURNISHER_BONDING_MODE_FORBIDDEN) {
            assert(bid.bond === 0n)
        } else if (this.furnisherBondingMode === EscrowContract.FURNISHER_BONDING_MODE_OPTIONAL) {
            assert(bid.bond >= 0n) // Bonds cannot be below sero, this would allow a worker to withdraw part of the payment when work starts.
        } else {
            assert(bid.bond === this.requiredBondAmount)
            assert(bid.bond >= 0n)
        }
        if (this.contractType === EscrowContract.TYPE_BID) {
            assert(this.ctx.utxo.value === 1n)
        }
        assert(bid.timeRequired > 0n)
        assert(bid.timeOfBid > 0n)
        if (this.delayUnit === EscrowContract.DELAY_UNIT_BLOCKS) {
            assert(bid.timeRequired < 500000000n)
            assert(bid.timeOfBid < 500000000n)
        } else {
            assert(bid.timeRequired > 500000000n)
            assert(bid.timeOfBid > 500000000n)
        }
        assert(this.ctx.sequence === 0xfffffffen)
        assert(this.ctx.locktime >= bid.timeOfBid)
        assert(this.bids.size + 1 <= this.maxAllowedBids)
        this.bids.add(bid)
        assert(this.ctx.hashOutputs === hash256(this.buildStateOutput(this.ctx.utxo.value)))
    }

    @method(SigHash.ANYONECANPAY_SINGLE)
    public seekerAcceptsBid(seekerSig: Sig, bid: Bid) {
        assert(this.state === EscrowContract.STATE_INITIAL)
        assert(this.bountySolversNeedApproval === 1n)
        assert(
            this.approvalMode === EscrowContract.FURNISHER_APPROVAL_MODE_SEEKER ||
            this.approvalMode === EscrowContract.FURNISHER_APPROVAL_MODE_SEEKER_OR_PLATFORM
        )
        assert(this.checkSig(seekerSig, this.seekerKey))
        assert(this.bids.has(bid))
        assert(this.ctx.sequence === 0xfffffffen)
        assert(this.ctx.locktime < this.workCompletionDeadline - bid.timeRequired)
        this.state = EscrowContract.STATE_BID_ACCEPTED
        this.acceptedBid = bid
        this.bidAcceptedBy = EscrowContract.BID_ACCEPTED_BY_SEEKER
        if (this.contractType === EscrowContract.TYPE_BID) {
            assert(this.ctx.hashOutputs === hash256(this.buildStateOutput(bid.bidAmount)))
        } else {
            assert(this.ctx.hashOutputs === hash256(this.buildStateOutput(this.ctx.utxo.value)))
        }
    }

    @method(SigHash.ANYONECANPAY_SINGLE)
    public platformAcceptsBid(platformSig: Sig, bid: Bid) {
        assert(this.state === EscrowContract.STATE_INITIAL)
        assert(this.bountySolversNeedApproval === 1n)
        assert(
            this.approvalMode === EscrowContract.FURNISHER_APPROVAL_MODE_PLATFORM ||
            this.approvalMode === EscrowContract.FURNISHER_APPROVAL_MODE_SEEKER_OR_PLATFORM
        )
        assert(this.checkSig(platformSig, this.platformKey))
        assert(this.bids.has(bid))
        assert(this.ctx.sequence === 0xfffffffen)
        assert(this.ctx.locktime < this.workCompletionDeadline - bid.timeRequired)
        this.state = EscrowContract.STATE_BID_ACCEPTED
        this.acceptedBid = bid
        this.bidAcceptedBy = EscrowContract.BID_ACCEPTED_BY_PLATFORM
        if (this.contractType === EscrowContract.TYPE_BID) {
            assert(this.ctx.hashOutputs === hash256(this.buildStateOutput(bid.bidAmount)))
        } else {
            assert(this.ctx.hashOutputs === hash256(this.buildStateOutput(this.ctx.utxo.value)))
        }
    }

    @method(SigHash.ANYONECANPAY_SINGLE)
    public seekerWithdrawsBidAcceptance(seekerSig: Sig) {
        assert(this.state === EscrowContract.STATE_BID_ACCEPTED)
        assert(this.checkSig(seekerSig, this.seekerKey))
        if (this.delayUnit === EscrowContract.DELAY_UNIT_BLOCKS) {
            assert(this.acceptedBid?.timeOfBid! + this.maxWorkStartDelay < 500000000n)
        } else {
            assert(this.acceptedBid?.timeOfBid! + this.maxWorkStartDelay > 500000000n)
        }
        assert(this.bountySolversNeedApproval === 1n)
        assert(
            this.approvalMode === EscrowContract.FURNISHER_APPROVAL_MODE_SEEKER ||
            this.approvalMode === EscrowContract.FURNISHER_APPROVAL_MODE_SEEKER_OR_PLATFORM
        )
        assert(this.bidAcceptedBy === EscrowContract.BID_ACCEPTED_BY_SEEKER)
        assert(this.ctx.sequence === 0xfffffffen)
        assert(this.ctx.locktime > this.acceptedBid?.timeOfBid! + this.maxWorkStartDelay)
        this.state = EscrowContract.STATE_INITIAL
        this.acceptedBid = null
        this.bidAcceptedBy = EscrowContract.BID_NOT_YET_ACCEPTED
        if (this.contractType === EscrowContract.TYPE_BID) {
            assert(this.ctx.hashOutputs === hash256(this.buildStateOutput(1n))) // Force bid amount to be withdrawn
        } else {
            assert(this.ctx.hashOutputs === hash256(this.buildStateOutput(this.ctx.utxo.value)))
        }
    }

    @method(SigHash.ANYONECANPAY_SINGLE)
    public platformWithdrawsBidAcceptance(platformSig: Sig) {
        assert(this.state === EscrowContract.STATE_BID_ACCEPTED)
        assert(this.checkSig(platformSig, this.platformKey))
        if (this.delayUnit === EscrowContract.DELAY_UNIT_BLOCKS) {
            assert(this.acceptedBid?.timeOfBid! + this.maxWorkStartDelay < 500000000n)
        } else {
            assert(this.acceptedBid?.timeOfBid! + this.maxWorkStartDelay > 500000000n)
        }
        assert(this.bountySolversNeedApproval === 1n)
        assert(
            this.approvalMode === EscrowContract.FURNISHER_APPROVAL_MODE_PLATFORM ||
            this.approvalMode === EscrowContract.FURNISHER_APPROVAL_MODE_SEEKER_OR_PLATFORM
        )
        assert(this.bidAcceptedBy === EscrowContract.BID_ACCEPTED_BY_PLATFORM)
        assert(this.ctx.sequence === 0xfffffffen)
        assert(this.ctx.locktime > this.acceptedBid?.timeOfBid! + this.maxWorkStartDelay)
        this.state = EscrowContract.STATE_INITIAL
        this.acceptedBid = null
        this.bidAcceptedBy = EscrowContract.BID_NOT_YET_ACCEPTED
        if (this.contractType === EscrowContract.TYPE_BID) {
            assert(this.ctx.hashOutputs === hash256(this.buildStateOutput(1n))) // Force bid amount to be withdrawn
        } else {
            assert(this.ctx.hashOutputs === hash256(this.buildStateOutput(this.ctx.utxo.value)))
        }
    }

    @method(SigHash.ANYONECANPAY_SINGLE)
    public furnisherStartsWork(furnisherSig: Sig) {
        assert(this.state === EscrowContract.STATE_BID_ACCEPTED)
        assert(this.platformAuthorizationRequired === 0n)
        assert(this.bountySolversNeedApproval === 1n)
        assert(this.checkSig(furnisherSig, this.acceptedBid?.furnisherKey!))
        this.state = EscrowContract.STATE_WORK_STARTED
        assert(this.ctx.hashOutputs === hash256(this.buildStateOutput(this.ctx.utxo.value + this.acceptedBid?.bond!)))
    }

    @method(SigHash.ANYONECANPAY_SINGLE)
    public furnisherStartsWorkWithPlatformAuthorization(furnisherSig: Sig, platformSig: Sig) {
        assert(this.state === EscrowContract.STATE_BID_ACCEPTED)
        assert(this.platformAuthorizationRequired === 1n)
        assert(this.bountySolversNeedApproval === 1n)
        assert(this.checkSig(furnisherSig, this.acceptedBid?.furnisherKey!))
        assert(this.checkSig(platformSig, this.platformKey))
        this.state = EscrowContract.STATE_WORK_STARTED
        assert(this.ctx.hashOutputs === hash256(this.buildStateOutput(this.ctx.utxo.value + this.acceptedBid?.bond!)))
    }

    // @method(SigHash.ANYONECANPAY_SINGLE)
    // public decrementOnChain() {
    //     // Increment counter value
    //     this.decrement()

    //     // make sure balance in the contract does not change
    //     const amount: bigint = this.ctx.utxo.value
    //     // outputs containing the latest state and an optional change output
    //     const outputs: ByteString = this.buildStateOutput(amount)
    //     // verify unlocking tx has the same outputs
    //     assert(this.ctx.hashOutputs == hash256(outputs), 'hashOutputs mismatch')
    // }

    // @method()
    // decrement(): void {
    //     this.count--
    // }
}