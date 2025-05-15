import {
    assert,
    ByteString,
    hash256,
    method,
    prop,
    SmartContract,
    SigHash
} from 'scrypt-ts'

export class EscrowContract extends SmartContract {
    @prop(true)
    count: bigint

    @prop(true)
    creatorIdentityKey: ByteString

    @prop(true)
    creatorSignature: ByteString

    constructor(count: bigint, creatorIdentityKey: ByteString, creatorSignature: ByteString) {
        super(...arguments)
        this.count = count
        this.creatorIdentityKey = creatorIdentityKey
        this.creatorSignature = creatorSignature
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