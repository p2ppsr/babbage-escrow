**ESCROWED WORK AGREEMENT (“Agreement”)**

> Consult a real lawyer before use, this was literally generated with ChatGPT. Do not use it in real contracts without legal review.
gca
> In no event shall the creators of this document be liable for any of its contents.

This Agreement is made as of \_\_\_ \[Date] (the “Effective Date”) by and among:

* **Seeker (“Client”)**: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
  *Public-key / ID (if any):* \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

* **Furnisher (“Contractor”)**: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
  *Public-key / ID (if any):* \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

* **Platform (“Escrow Agent & Dispute Resolver”)**: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
  *Public-key / ID (if any):* \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

The parties agree as follows:

---

## 1. PURPOSE & SCOPE OF WORK

1.1 **Work Description.** The Contractor shall complete the work described in *Schedule A* (“Work”).
1.2 **Contract Type.** ☐ *Bounty* (fixed reward) ☐ *Bid* (variable price).
1.3 **Completion Deadline.** The Work must be fully delivered by \_\_\_ \[date / time] (“Completion Deadline”) unless extended under §9.

---

## 2. ESCROW FUNDING & FEES

2.1 **Funding.** On execution (if a *Bounty* Contract Type, or upon acceptance of a Bid, if a *Bid* Contract Type), the Client shall transfer to the Escrow Agent the total amount appearing in *Schedule B* (the “Escrow Funds”).

2.2 **Escrow Service Fee.** The Escrow Agent shall deduct \_\_\_ % of the Escrow Funds (the “Escrow Fee”) upon final disbursement in case of a dispute. If no dispute resolution services are needed, the Escrow Agent shall not deduct any Escrow Fee.

2.3 **Minimum & Maximum Bids (Bid Contracts Only).**
*Minimum Allowable Bid:* \_\_\_\_\_\_\_\_\_\_ *Maximum Number of Bids:* \_\_\_\_\_

---

## 3. BIDS & BONDS (Bid Contracts)

3.1 **Submission of Bids.** A bid (“Bid”) must state: (a) proposed price, (b) optional bond amount, (c) time required to perform, (d) submission time, and (e) execution plans.

3.2 **Bonding Mode (choose one):**

| Mode        | Description                                             | Required Bond Amount |
| ----------- | ------------------------------------------------------- | -------------------- |
| ☐ Forbidden | No bond permitted                                       | N/A                  |
| ☐ Optional  | Bond is permitted but not mandatory                     | N/A (may be zero)    |
| ☐ Required  | Bid is **invalid** unless accompanied by the bond below | \_\_\_               |

3.3 **Bid Selection & Acceptance.**
(a) **Approval Authority:** ☐ Client ☐ Platform ☐ Either.
(b) Acceptance must occur before the earlier of (i) receipt of the maximum number of bids or (ii) the Completion Deadline minus the bidder’s stated performance time.
(c) Upon acceptance, the selected Bid becomes the “Accepted Bid,” the bidder becomes the “Contractor,” and the Contract Status moves to **Bid Accepted**.

3.4 **Withdrawal of Acceptance for Delay in Starting Work.**
If the Contractor fails to begin Work within \_\_\_ (time) after acceptance (“Start Delay Limit”), the party that accepted the Bid may cancel acceptance, reverting the Agreement to the **Initial** status. Any bid price held in escrow for a Bid contract shall be released back to the Approving Authority.

---

## 4. BOUNTY CONTRACTS

4.1 If *Bounty* is selected in §1.2, the reward equals the Escrow Funds to be deposited upon agreement execution.

4.2 **Bounty Increases** (select one allowance mode):

| Mode                 | Who may increase | Latest increase point |
| -------------------- | ---------------- | --------------------- |
| ☐ Forbidden          | Nobody           | N/A                   |
| ☐ Client             | Client only      | see below             |
| ☐ Platform           | Platform only    | see below             |
| ☐ Client or Platform | Either           | see below             |
| ☐ Anyone             | Any person       | see below             |

*Cut-off Point:* ☐ Before any bid is accepted ☐ Before work starts ☐ Before work is submitted ☐ Before acceptance of work
No increase may occur after the selected cut-off point.

---

## 5. WORK COMMENCEMENT

5.1 **Platform Authorization Required:** ☐ Yes ☐ No.

5.2 The Contractor must commence Work only after:
(a) acceptance of the Bid (or, for Bounty contracts where §5.4 applies, submission of Work),
(b) posting any required bond, and
(c) obtaining Platform authorization if §5.1 = Yes.

5.3 Upon commencement, Contract Status changes to **Work Started**.

5.4 *(Bounty contracts with “No Approval Needed”)* If “Solver Approval Required” ≠ Yes (see *Schedule B*), any person may instead submit a finished solution directly (§7.1).

---

## 6. BONDS

6.1 The Escrow Agent shall hold any Contractor bond.

6.2 The bond is released to the Contractor together with the reward upon successful completion, or to the Client upon a final decision that denies payment to the Contractor.

---

## 7. SUBMISSION & APPROVAL OF WORK

7.1 **Submission.** The Contractor shall submit the completed Work together with a written completion statement. Contract Status becomes **Work Submitted** and the submission time is recorded.

7.2 **Client Review Period.** Within \_\_\_ (time) after submission (“Approval Window”) the Client shall either:
(a) provide written approval, moving the Contract Status to **Resolved**, or
(b) raise a dispute under §8.

7.3 Failure to act within the Approval Window entitles the Contractor to raise a dispute under §8.2.

---

## 8. DISPUTE RESOLUTION

8.1 **Initiating a Dispute.**
*By Client.* The Client may dispute at any time after Work Started if the Completion Deadline lapses, or during the Approval Window if dissatisfied with the Work.
*By Contractor.* The Contractor may dispute if the Client fails to approve or dispute within the Approval Window.

8.2 **Escalation to Platform.** Upon any dispute, Contract Status becomes **Disputed**. The Platform shall review evidence from both parties.

8.3 **Decision & Payouts.** The Platform’s decision is final. It shall allocate amounts to the Client and/or Contractor (less the Escrow Fee) as it deems appropriate, subject to:
*If “Fully Decisive Escrow” = Yes (see *Schedule B*) only one party may receive payment; the other receives zero.*

8.4 **Disbursement Mechanics.** The Escrow Agent shall disburse the decided amounts and any unused bond, retaining the Escrow Fee.

---

## 9. DEADLINE EXTENSIONS

9.1 **Extension by Client.** Prior to the earlier of (i) acceptance of Bid, (ii) Work Started, or (iii) Work Submitted, the Client may extend the Completion Deadline once, by no more than \_\_\_ (time).

9.2 The Escrow Agent shall record the new deadline.

---

## 10. TERMINATION BEFORE BID ACCEPTANCE

10.1 **Client Cancellation.** While the Contract Status is **Initial**, the Client may cancel the Agreement and retrieve all Escrow Funds (minus any Escrow Fee already earned).

10.2 Thereafter, the Agreement may be terminated only as set out in §§3.4, 8, or 12.

---

## 11. PAYMENT CLAIM

11.1 When the Contract Status is **Resolved**, the Contractor may claim payment.

11.2 The Escrow Agent shall release:
(a) the reward (Bid price or Bounty) and
(b) any bond.

---

## 12. MISCELLANEOUS

12.1 **Governing Law.** This Agreement is governed by the laws of \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_.

12.2 **Entire Agreement.** This document and its schedules constitute the entire agreement.

12.3 **Amendments.** Any amendment must be in writing and signed by all parties.

12.4 **Notices.** Notices shall be sent to the addresses in *Schedule C* by email or courier and are effective on delivery.

12.5 **Assignment.** Neither Contractor nor Client may assign this Agreement without the other’s written consent, except to a successor in interest of substantially all business assets.

12.6 **Counterparts & Electronic Signatures.** This Agreement may be executed in counterparts and by electronic signature, each of which is an original and all of which constitute the same instrument.

---

### SCHEDULE A – WORK DESCRIPTION

*(Attach detailed statement of work, specifications, quality standards, deliverables, and acceptance criteria.)*

---

### SCHEDULE B – COMMERCIAL TERMS

| Item                                     | Value / Selection    |
| ---------------------------------------- | -------------------- |
| Escrow Fee (%)                           | \_\_\_ %             |
| Contract Type                            | ☐ Bounty ☐ Bid       |
| Minimum Allowable Bid (Bid)              | \_\_\_\_\_\_\_\_\_\_ |
| Maximum Allowed Bids (Bid)               | \_\_\_\_\_\_\_\_\_\_ |
| Solver Approval Required                 | ☐ Yes ☐ No           |
| Fully Decisive Escrow                    | ☐ Yes ☐ No           |
| Bonding Mode                             | see §3.2             |
| Required Bond (if applicable)            | \_\_\_\_\_\_\_\_\_\_ |
| Start Delay Limit                        | \_\_\_ (time)        |
| Approval Window                          | \_\_\_ (time)        |
| Platform Authorization Required to Start | ☐ Yes ☐ No           |
| Bounty Increase Allowance Mode           | see §4.2             |
| Bounty Increase Cut-off Point            | see §4.2             |

---

### SCHEDULE C – NOTICE ADDRESSES

| Party      | Physical Address | Email |
| ---------- | ---------------- | ----- |
| Client     |                  |       |
| Contractor |                  |       |
| Platform   |                  |       |

---

**SIGNATURES**

| Party      | Name & Title | Signature | Date |
| ---------- | ------------ | --------- | ---- |
| Client     |              |           |      |
| Contractor |              |           |      |
| Platform   |              |           |      |
