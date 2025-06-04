import { CreateActionOutput, LockingScript, LookupAnswer, PrivateKey, Transaction, TransactionSignature, WalletInterface } from "@bsv/sdk"
import { EscrowRecord, EscrowTX, GlobalConfig } from "./constants.js"
import { EscrowContract } from "./contracts/Escrow.js"
import { bsv, fill, PubKey, Sig, SmartContract, toByteString } from "scrypt-ts"
import { sha256 } from "@bsv/sdk/primitives/Hash"

const blankSig = Sig(toByteString(new PrivateKey(1).sign([]).toDER('hex') as string))

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

export const recordsFromAnswer = (answer: LookupAnswer): Array<EscrowTX> => {
    if (answer.type !== 'output-list') throw new Error('Answer must be output-list')
    const results: Array<EscrowTX> = []
    for (const o of answer.outputs) {
        try {
            const tx = Transaction.fromBEEF(o.beef)
            const script = tx.outputs[o.outputIndex].lockingScript.toHex()
            const satoshis = tx.outputs[o.outputIndex].satoshis as number
            const escrow = EscrowContract.fromLockingScript(script) as EscrowContract
            results.push({
                record: recordFromContract(tx.id('hex'), o.outputIndex, escrow),
                contract: escrow,
                script,
                satoshis,
                beef: o.beef
            })
        } catch (e) {}
    }
    return results
}

export const contractFromGlobalConfigAndParams = (config: GlobalConfig, seekerKey: string, workDescription: string, workCompletionDeadline: number): EscrowContract => {
    return new EscrowContract(
        PubKey(toByteString(seekerKey)),
        PubKey(toByteString(config.platformKey)),
        BigInt(config.escrowServiceFeeBasisPoints),
        config.platformAuthorizationRequired ? 1n : 0n,
        toByteString(workDescription, true),
        BigInt(workCompletionDeadline),
        BigInt(config.minAllowableBid),
        config.bountySolversNeedApproval ? 1n : 0n,
        config.escrowMustBeFullyDecisive ? 1n : 0n,
        config.furnisherBondingMode === 'forbidden'
            ? EscrowContract.FURNISHER_BONDING_MODE_FORBIDDEN : config.furnisherBondingMode === 'optional'
            ? EscrowContract.FURNISHER_BONDING_MODE_OPTIONAL
            : EscrowContract.FURNISHER_BONDING_MODE_REQUIRED,
        BigInt(config.requiredBondAmount),
        BigInt(config.maxWorkStartDelay),
        BigInt(config.maxWorkApprovalDelay),
        config.delayUnit === 'blocks'
            ? EscrowContract.DELAY_UNIT_BLOCKS
            : EscrowContract.DELAY_UNIT_SECONDS,
        config.approvalMode === 'seeker'
            ? EscrowContract.FURNISHER_APPROVAL_MODE_SEEKER : config.approvalMode === 'platform'
            ? EscrowContract.FURNISHER_APPROVAL_MODE_PLATFORM
            : EscrowContract.FURNISHER_APPROVAL_MODE_SEEKER_OR_PLATFORM,
        config.bountyIncreaseAllowanceMode === 'forbidden'
            ? EscrowContract.BOUNTY_INCREASE_FORBIDDEN : config.bountyIncreaseAllowanceMode === 'by-seeker'
            ? EscrowContract.BOUNTY_INCREASE_ALLOWED_BY_SEEKER : config.bountyIncreaseAllowanceMode === 'by-platform'
            ? EscrowContract.BOUNTY_INCREASE_ALLOWED_BY_PLATFORM : config.bountyIncreaseAllowanceMode === 'by-seeker-or-platform'
            ? EscrowContract.BOUNTY_INCREASE_ALLOWED_BY_SEEKER_OR_PLATFORM
            : EscrowContract.BOUNTY_INCREASE_ALLOWED_BY_ANYONE,
        config.bountyIncreaseCutoffPoint === 'bid-acceptance'
            ? EscrowContract.INCREASE_CUTOFF_BID_ACCEPTANCE : config.bountyIncreaseCutoffPoint === 'start-of-work'
            ? EscrowContract.INCREASE_CUTOFF_START_OF_WORK : config.bountyIncreaseCutoffPoint === 'submission-of-work'
            ? EscrowContract.INCREASE_CUTOFF_SUBMISSION_OF_WORK
            : EscrowContract.INCREASE_CUTOFF_ACCEPTANCE_OF_WORK,
        config.contractType === 'bid'
            ? EscrowContract.TYPE_BID
            : EscrowContract.TYPE_BOUNTY,
        config.contractSurvivesAdverseFurnisherDisputeResolution ? 1n : 0n,
        fill({
            furnisherKey: PubKey(toByteString(seekerKey)),
            plans: '',
            timeOfBid: 0n,
            bond: 0n,
            bidAmount: 0n,
            timeRequired: 0n
        }, 4)
    )
}

export const callContractMethod = async (
    wallet: WalletInterface,
    escrow: EscrowTX,
    methodName: string,
    params: Array<any>,
    nextOutputAmount?: number,
    otherOutputs?: Array<CreateActionOutput>,
    sequenceNumber: number = 0xffffffff,
    lockTime: number = 0,
    unlockingScriptLength = 1200000
) => {
    // Compute blank signatures for use at first until signatories are called
    const blankedParams = params.map((x) => typeof x === 'function' || x === 'WONTSIGN' ? blankSig : x)

    escrow.contract.to = {
        tx: new bsv.Transaction().addInput(new bsv.Transaction.Input({
            prevTxId: escrow.record.txid,
            prevOutputIndex: escrow.record.outputIndex,
            script: new bsv.Script('')
        }), escrow.script, escrow.satoshis),
        inputIndex: 0
    }

    // Get the next locking script using the non-assertion code path
    let nextLockingScript: string
    if (typeof (escrow.contract as any)[methodName] === 'function') {
        const clone = EscrowContract.fromLockingScript(escrow.script);
        (clone as any)[methodName](...blankedParams);
        nextLockingScript = clone.lockingScript.toHex();
    } else {
        nextLockingScript = escrow.script;
    }

    // Get a signable transaction we can work with
    const { signableTransaction } = await wallet.createAction({
        description: 'Update contract',
        inputBEEF: escrow.beef,
        inputs: [{
            outpoint: `${escrow.record.txid}.${escrow.record.outputIndex}`,
            unlockingScriptLength,
            sequenceNumber,
            inputDescription: 'Redeem old contract'
        }],
        outputs: typeof nextOutputAmount === 'number' ? [{
            satoshis: nextOutputAmount,
            lockingScript: nextLockingScript,
            outputDescription: 'New contract output'
        }, ...(otherOutputs || [])] : otherOutputs,
        lockTime,
        options: {
            randomizeOutputs: false,
            acceptDelayedBroadcast: false
        }
    })

    // The preimage we'll sign depends on the hash type
    const scope = escrow.contract.sigTypeOfMethod(`${methodName}OnChain`)
    const partialTX = Transaction.fromAtomicBEEF(signableTransaction!.tx)
    const otherInputs = [...partialTX.inputs]
    otherInputs.splice(0, 1)
    const formatParams = {
        sourceTXID: escrow.record.txid,
        sourceOutputIndex: escrow.record.outputIndex,
        sourceSatoshis: escrow.satoshis,
        transactionVersion: partialTX.version,
        otherInputs,
        inputIndex: 0,
        inputSequence: partialTX.inputs[0].sequence!,
        outputs: partialTX.outputs,
        subscript: LockingScript.fromHex(escrow.script),
        lockTime: partialTX.lockTime,
        scope
    }
    const preimage = TransactionSignature.format(formatParams)
    const preimageHash = sha256(preimage)

    // Obtain signatures from all signatories
    const hydratedParams = await Promise.all(params.map(async p => {
        if (p === 'WONTSIGN') return blankSig
        if (typeof p !== 'function') return p
        return await p(preimageHash, scope)
    }))

    const tx = new bsv.Transaction(partialTX.toHex())
    for (let i = 0; i < tx.inputs.length; i++) {
        tx.inputs[i].output = new bsv.Transaction.Output({
            script: new bsv.Script(partialTX.inputs[i].sourceTransaction!.outputs[partialTX.inputs[i].sourceOutputIndex].lockingScript.toHex()),
            satoshis: partialTX.inputs[i].sourceTransaction!.outputs[partialTX.inputs[i].sourceOutputIndex].satoshis as number
        })
    }
    escrow.contract.to = {
        tx,
        inputIndex: 0
    }

    // Obtain an unlocking script
    const unlockingScript = escrow.contract.getUnlockingScript((self) => {
        (self as any)[`${methodName}OnChain`](...hydratedParams)
    }).toHex()

    // Complete the transaction
    return await wallet.signAction({
        reference: signableTransaction!.reference,
        spends: {
            0: {
                unlockingScript,
                sequenceNumber
            }
        },
        options: {
            acceptDelayedBroadcast: false
        }
    })
}