# KEL Connect demo

Interactive company-workspace prototype for reviewing conversations, time off and team planning.

**Demo:** https://bodia0210.github.io/Kehoe-Team/connect/

The demo opens in English. Use the language button in the top-right corner to switch to Ukrainian.

## Try the demo

1. Open **Messages** and create a group or send a sample message.
2. Open **Time off** to request vacation, sick leave, hourly personal time or an available bonus day.
3. Switch **Demo profile** to another administrator or manager to approve a request. A manager cannot approve their own request.
4. Open **Administration** to add a sample employee, change allowances, set company days off or grant a separate **+1 bonus day** for a birthday, anniversary or owner's gift.
5. Open **Team calendar** to review the monthly employee overview. Bonus days are green with a gift; company closures are grey. Use **Export for Outlook** to download an `.ics` calendar.

## How this prototype works

- It contains sample profiles and illustrative allowances, not confirmed company policies.
- Everything is stored in this browser under `kel-connect-public-demo-v1`. Different visitors do not share messages, employees, requests or approvals.
- All demo roles are selectable. This demonstrates the intended workflow; it is not an access-control system.
- Adding an employee does not create a Microsoft account or send an invitation.
- Outlook export is a manual download. Automatic Microsoft 365 synchronization is not connected.
- Weekends and configured company days off do not consume leave allowances. A bonus uses its own grant, independently of vacation.
- Never enter real confidential company, employee or medical information into the public demo.

A live company rollout requires corporate sign-in, a shared backend, server-enforced permissions and agreed HR policies.

## Development

Serve this directory with any static web server. No dependencies or build are required. Run model checks with:

```sh
node connect/tests/hr-model.test.cjs
```

The existing parent website and its files are separate from this demo directory.
