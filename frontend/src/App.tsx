import React, { FormEvent } from 'react'
import { Seeker } from 'babbage-escrow'
import type { GlobalConfig } from 'babbage-escrow'
import { WalletClient } from '@bsv/sdk'

const config: GlobalConfig = {
  minAllowableBid: 0,
  escrowServiceFeeBasisPoints: 125,
  platformAuthorizationRequired: false,
  escrowMustBeFullyDecisive: false,
  bountySolversNeedApproval: true,
  furnisherBondingMode: 'optional',
  requiredBondAmount: 0,
  maxWorkStartDelay: 144,
  maxWorkApprovalDelay: 144,
  delayUnit: 'blocks',
  approvalMode: 'seeker',
  contractType: 'bid',
  contractSurvivesAdverseFurnisherDisputeResolution: false,
  bountyIncreaseAllowanceMode: 'forbidden',
  bountyIncreaseCutoffPoint: 'bid-acceptance',
  platformKey: '02a064784ebb435e87c3961745b01e3564d41149ea1291d1a73783d1b7b3a7a220',
  topic: 'tm_escrow',
  service: 'ls_escrow',
  keyDerivationProtocol: [2, 'escrow'],
  networkPreset: 'local'
}

const wallet = new WalletClient()

const App = () => {

  const handleClick = async () => {
    const seeker = new Seeker(config, wallet)
    console.log(seeker)
    await seeker.seek('I want 4 jolly ranchers delivered @ the Babbage Medford HQ', 1000000)
    const list = await seeker.getMyOpenContracts()
    console.log(list)
    await seeker.cancelBeforeAccept(list[0])
    console.log('Done!')
  }

  return (
    <div>
      <h1>Hello</h1>
      <button onClick={handleClick}>Go</button>
    </div>
  )
}

export default App