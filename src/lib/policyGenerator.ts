
export const generateVisitingPolicy = (companyName: string) => {
    const date = new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    return `VISITING IN CARE HOMES - POLICY & PROCEDURE
--------------------------------------------------
Organization: ${companyName}
Date Effective: ${date}
Regulation: 9A (Health and Social Care Act 2008 (Regulated Activities) Regulations 2014)

1. POLICY STATEMENT
${companyName} is committed to ensuring that all residents (service users) can receive visits from their friends, family, and other people important to them. We recognize that visiting is a fundamental part of care home life and is crucial for the health, well-being, and quality of life of our residents.

We adopt a default position that visiting is UNRESTRICTED unless:
a) There is a specific, individual risk assessment suggesting otherwise for the safety of the resident.
b) There is specific government advice (e.g., during a severe outbreak) that legally overrides this policy.

2. COMPLIANCE WITH REGULATION 9A
In accordance with CQC Regulation 9A, we ensure:
- No "blanket bans" on visiting are ever imposed.
- Any restrictions are proportionate, temporary, and based on individual risk assessments.
- Residents are facilitated to attend appointments and activities outside the home without unnecessary isolation upon return.

3. ESSENTIAL CARE GIVERS
Every resident at ${companyName} is entitled to nominate an Essential Care Giver (ECG).
- The ECG can visit even during outbreaks or when the home is in "recovery" status.
- The ECG helps with care and support (e.g., companionship, personal care) and is vital for the resident's well-being.

4. VISITING ARRANGEMENTS
- Visits can take place in residents' private rooms.
- There is no requirement to book in advance, though we appreciate notice for meal planning.
- Visitors should not visit if they are feeling unwell or have symptoms of infectious illness.

5. OUT OF HOME VISITS
Residents will be supported to leave the home for education, work, voting, or social visits. Upon return, they will not be asked to self-isolate unless there is a specific, confirmed clinical reason (e.g., positive COVID-19 test or specific guidance at the time).

6. DECISION MAKING
Any decision to restrict visiting for an individual will be:
- Documented in their care plan.
- Discussed with the resident and their family/advocate.
- Reviewed regularly (at least weekly).

--------------------------------------------------
Approved By: Management Team
Review Date: 12 Months from ${date}
`;
};
