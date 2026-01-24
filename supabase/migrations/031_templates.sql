-- =====================================================
-- POLICY TEMPLATES TABLE
-- Store reusable policy/form/audit templates
-- =====================================================

CREATE TABLE IF NOT EXISTS policy_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Template metadata
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('policy', 'form', 'audit', 'checklist', 'procedure')),
    
    -- CQC alignment
    regulation_ids TEXT[], -- e.g., ['Reg 12', 'Reg 13']
    quality_statement_ids TEXT[], -- e.g., ['S1', 'S3', 'W5']
    key_questions TEXT[], -- e.g., ['safe', 'wellLed']
    
    -- Service type targeting
    service_types TEXT[], -- e.g., ['residential', 'domiciliary', 'supported']
    
    -- Content
    content TEXT NOT NULL, -- The actual template content (Markdown or HTML)
    content_format TEXT DEFAULT 'markdown' CHECK (content_format IN ('markdown', 'html', 'plain')),
    
    -- Versioning
    version TEXT DEFAULT '1.0',
    
    -- Access control
    is_premium BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT true,
    
    -- Analytics
    downloads INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE policy_templates ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view published templates
CREATE POLICY "Users can view published templates"
    ON policy_templates FOR SELECT
    USING (is_published = true);

-- Admins can manage templates (for future admin panel)
CREATE POLICY "Admins can manage templates"
    ON policy_templates FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'owner'
        )
    );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_templates_category ON policy_templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_published ON policy_templates(is_published);
CREATE INDEX IF NOT EXISTS idx_templates_premium ON policy_templates(is_premium);

-- Grant permissions
GRANT SELECT ON TABLE policy_templates TO authenticated;

-- =====================================================
-- TEMPLATE DOWNLOADS TABLE (for analytics)
-- =====================================================

CREATE TABLE IF NOT EXISTS template_downloads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID REFERENCES policy_templates(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    downloaded_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE template_downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can log downloads"
    ON template_downloads FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

GRANT INSERT ON TABLE template_downloads TO authenticated;

-- =====================================================
-- SEED INITIAL TEMPLATES
-- =====================================================

INSERT INTO policy_templates (name, description, category, regulation_ids, quality_statement_ids, key_questions, service_types, content, is_premium) VALUES

-- POLICIES
('Safeguarding Adults Policy', 
 'Comprehensive policy for protecting adults at risk from abuse and neglect, aligned with CQC Regulation 13.',
 'policy',
 ARRAY['Reg 13'],
 ARRAY['S3'],
 ARRAY['safe'],
 ARRAY['residential', 'domiciliary', 'supported'],
 '# Safeguarding Adults Policy

## 1. Policy Statement

[Organisation Name] is committed to safeguarding all adults using our services. We have a zero-tolerance approach to abuse and neglect of any kind.

## 2. Scope

This policy applies to all staff, volunteers, contractors, and visitors who have contact with adults using our services.

## 3. Definitions

**Safeguarding** means protecting an adult''s right to live in safety, free from abuse and neglect.

**Types of Abuse:**
- Physical abuse
- Domestic abuse
- Sexual abuse
- Psychological abuse
- Financial or material abuse
- Modern slavery
- Discriminatory abuse
- Organisational abuse
- Neglect and acts of omission
- Self-neglect

## 4. Key Principles

We follow the six key principles of safeguarding:
1. **Empowerment** – Presumption of person-led decisions and informed consent
2. **Prevention** – It is better to take action before harm occurs
3. **Proportionality** – Proportionate and least intrusive response
4. **Protection** – Support and representation for those in greatest need
5. **Partnership** – Local solutions through services working together
6. **Accountability** – Accountability and transparency in safeguarding practice

## 5. Responsibilities

### 5.1 Registered Manager
- Acts as the Safeguarding Lead
- Ensures all staff receive safeguarding training
- Reports concerns to local authority and CQC as required
- Maintains records of all safeguarding concerns

### 5.2 All Staff
- Complete safeguarding training before working with service users
- Report all concerns immediately
- Document observations accurately
- Never investigate concerns themselves

## 6. Reporting Procedure

1. **If immediate danger** – Call 999
2. **Record** – Document what you have seen/been told using exact words
3. **Report** – Inform the Registered Manager immediately
4. **Preserve evidence** – Do not wash, clean, or disturb the scene
5. **Support** – Reassure the person that they have done the right thing

### Contact Numbers:
- Local Authority Safeguarding Team: [Insert Number]
- Police: 999 or 101
- CQC: 03000 616161

## 7. Training

All staff will receive:
- Safeguarding awareness training at induction
- Annual refresher training
- Additional training for specific concerns (e.g., MCA, DoLS)

## 8. Record Keeping

All safeguarding concerns will be recorded on our incident reporting system and stored securely for [X] years.

## 9. Review

This policy will be reviewed annually or following any significant incident.

---
**Version:** 1.0
**Last Reviewed:** [Date]
**Next Review:** [Date]
**Author:** [Name]
**Approved By:** [Name]',
 false),

('Medication Management Policy',
 'Policy for safe handling, administration, and recording of medicines in accordance with Regulation 12.',
 'policy',
 ARRAY['Reg 12'],
 ARRAY['S8'],
 ARRAY['safe'],
 ARRAY['residential', 'domiciliary'],
 '# Medication Management Policy

## 1. Policy Statement

[Organisation Name] is committed to ensuring all medicines are managed safely and in accordance with current legislation and best practice guidelines.

## 2. Scope

This policy covers the receipt, storage, administration, disposal, and recording of all medicines.

## 3. Staff Competency

Only staff who have:
- Completed medication administration training
- Passed a competency assessment
- Been signed off by the Registered Manager

may administer medication.

## 4. Safe Administration

### The 6 Rights:
1. **Right Person** – Check identity before administration
2. **Right Medication** – Check medication name against MAR chart
3. **Right Dose** – Verify the dose prescribed
4. **Right Route** – Oral, topical, injection, etc.
5. **Right Time** – Within one hour of prescribed time
6. **Right Documentation** – Sign MAR chart immediately

## 5. Controlled Drugs

- Must be stored in a separate locked cabinet
- Require two-signature administration
- Balance must be checked daily
- Record in the Controlled Drugs Register

## 6. PRN Medication

- Clear protocols must be in place
- Reason for administration documented
- Effectiveness reviewed and recorded

## 7. Errors and Near Misses

All medication errors must be:
- Reported to the manager immediately
- Documented on an incident form
- Notified to CQC if significant harm occurs
- Used as learning opportunities

## 8. Storage

- Room temperature medicines: 15-25°C
- Refrigerated medicines: 2-8°C
- Daily temperature checks recorded

---
**Version:** 1.0
**Linked Regulations:** Regulation 12 (Safe Care and Treatment)',
 false),

('Infection Prevention and Control Policy',
 'Comprehensive IPC policy covering hand hygiene, PPE, outbreak management, and staff training.',
 'policy',
 ARRAY['Reg 12'],
 ARRAY['S7'],
 ARRAY['safe'],
 ARRAY['residential', 'domiciliary', 'supported'],
 '# Infection Prevention and Control Policy

## 1. Policy Statement

[Organisation Name] is committed to minimising the risk of infection to service users, staff, and visitors.

## 2. Hand Hygiene

Hand hygiene is the single most important measure for preventing the spread of infection.

### The 5 Moments for Hand Hygiene:
1. Before touching a service user
2. Before a clean/aseptic procedure
3. After body fluid exposure risk
4. After touching a service user
5. After touching service user surroundings

### Method:
- Soap and water for at least 20 seconds when hands are visibly soiled
- Alcohol-based hand rub when hands appear clean

## 3. Personal Protective Equipment (PPE)

| Task | Gloves | Apron | Mask | Eye Protection |
|------|--------|-------|------|----------------|
| Personal care | ✓ | ✓ | If risk of splashing | If risk of splashing |
| Wound care | ✓ | ✓ | If risk | If risk |
| Respiratory illness | ✓ | ✓ | ✓ | Consider |

PPE must be:
- Single use only
- Changed between service users
- Disposed of in clinical waste

## 4. Outbreak Management

If an outbreak is suspected:
1. Isolate affected individuals where possible
2. Inform Public Health England / UKHSA
3. Increase cleaning frequency
4. Restrict non-essential visitors
5. Staff should not work across multiple locations

## 5. Cleaning

- High-touch surfaces cleaned at least twice daily
- Cleaning schedules documented and audited
- Appropriate products used (BS EN 14476 for viruses)

## 6. Training

All staff will complete:
- IPC training at induction
- Annual IPC updates
- Outbreak-specific training as required

---
**IPC Lead:** [Name]
**Last Review:** [Date]',
 false),

-- FORMS
('Consent Form Template',
 'Template for obtaining and recording consent for care and treatment.',
 'form',
 ARRAY['Reg 11'],
 ARRAY['E6'],
 ARRAY['effective'],
 ARRAY['residential', 'domiciliary', 'supported'],
 '# Consent to Care and Treatment

## Service User Details

| Field | Information |
|-------|-------------|
| **Name:** | |
| **Date of Birth:** | |
| **Address:** | |

## Consent Declaration

I confirm that I have been given information about:

- [ ] The care and treatment I will receive
- [ ] The benefits and risks of the proposed care
- [ ] Alternative options available to me
- [ ] My right to refuse or withdraw consent at any time

I have had the opportunity to ask questions and have them answered satisfactorily.

## Consent Given

I consent to the following care and treatment:

1. Personal care and support with daily living activities
2. Administration of prescribed medication
3. Health monitoring as appropriate
4. Sharing of relevant information with healthcare professionals

**Signature:** _________________________

**Print Name:** _________________________

**Date:** _________________________

---

## If consent is given by a representative:

**Representative Name:** _________________________

**Relationship:** _________________________

**Reason for signing on behalf:** _________________________

**Signature:** _________________________

**Date:** _________________________

---

## Staff Witness

I confirm that I have explained the above to the service user/representative and they appear to understand.

**Staff Name:** _________________________

**Signature:** _________________________

**Date:** _________________________',
 false),

('Mental Capacity Assessment Form',
 'Form for assessing capacity to make specific decisions under the Mental Capacity Act 2005.',
 'form',
 ARRAY['Reg 11'],
 ARRAY['E6'],
 ARRAY['effective'],
 ARRAY['residential', 'domiciliary', 'supported'],
 '# Mental Capacity Assessment

## Section 1: Service User Information

| Field | Information |
|-------|-------------|
| **Name:** | |
| **Date of Birth:** | |
| **Date of Assessment:** | |
| **Assessor:** | |

## Section 2: Decision to be Made

**What specific decision needs to be made?**

_____________________________________________

**Why does this decision need to be made now?**

_____________________________________________

## Section 3: Impairment of Mind or Brain

**Does the person have an impairment or disturbance of the mind or brain?**

- [ ] Yes
- [ ] No

**If yes, describe the impairment:**

_____________________________________________

## Section 4: The Two-Stage Test

### Stage 1: Is there an impairment?
Answer above

### Stage 2: Functional Test

Can the person:

| Criteria | Yes | No | Evidence |
|----------|-----|----|----|
| **Understand** the relevant information? | | | |
| **Retain** the information long enough to make a decision? | | | |
| **Weigh up** the information to make a decision? | | | |
| **Communicate** their decision? | | | |

## Section 5: Conclusion

**Does the person lack capacity to make this specific decision?**

- [ ] Yes – lacks capacity (proceed to Best Interest Decision)
- [ ] No – has capacity (respect their decision)

## Section 6: Assessor Declaration

I have assessed [Name]''s capacity in relation to the above decision. I have taken all practicable steps to support them to make their own decision.

**Signature:** _________________________

**Date:** _________________________

**Role:** _________________________',
 false),

-- AUDITS
('Monthly Medication Audit',
 'Comprehensive monthly audit tool for medication management, storage, and recording.',
 'audit',
 ARRAY['Reg 12'],
 ARRAY['S8'],
 ARRAY['safe'],
 ARRAY['residential', 'domiciliary'],
 '# Monthly Medication Audit

**Location:** _________________ **Date:** _________________

**Auditor:** _________________ **Staff Present:** _________________

## Section A: Storage & Security

| Check | Yes | No | N/A | Comments |
|-------|-----|----|----|----------|
| Medication cabinet locked? | | | | |
| CD cabinet double-locked? | | | | |
| Room temperature 15-25°C? | | | | |
| Temperature log completed daily? | | | | |
| Fridge 2-8°C? | | | | |
| Fridge temperature logged? | | | | |
| Medicines clearly labelled? | | | | |
| In-date medications only? | | | | |

**Score: ___ / 8**

## Section B: MAR Charts

| Check | Yes | No | Comments |
|-------|-----|----|----------|
| Photo ID on all charts? | | | |
| Allergies recorded? | | | |
| GP details complete? | | | |
| All codes explained? | | | |
| No unexplained gaps? | | | |
| PRN protocols in place? | | | |
| Homely remedies documented? | | | |

**Score: ___ / 7**

## Section C: Controlled Drugs

| Check | Yes | No | N/A | Comments |
|-------|-----|----|----|----------|
| CD register in use? | | | | |
| Running balance accurate? | | | | |
| Two signatures for each dose? | | | | |
| Daily balance check? | | | | |
| Destructions witnessed & recorded? | | | | |

**Score: ___ / 5**

## Section D: Staff Competency

| Check | Yes | No | Comments |
|-------|-----|----|----------|
| All medication staff trained? | | | |
| Competency assessments in date? | | | |
| Error reporting understood? | | | |

**Score: ___ / 3**

## Overall Score

| Section | Score |
|---------|-------|
| A: Storage & Security | / 8 |
| B: MAR Charts | / 7 |
| C: Controlled Drugs | / 5 |
| D: Staff Competency | / 3 |
| **TOTAL** | **/ 23** |

## Actions Required

| Issue | Action | Responsible | Due Date | Complete |
|-------|--------|-------------|----------|----------|
| | | | | |
| | | | | |

**Next Audit Date:** _________________

**Manager Signature:** _________________',
 false),

-- CHECKLISTS
('Pre-Inspection Checklist',
 'Comprehensive checklist to prepare for a CQC inspection visit.',
 'checklist',
 ARRAY['Reg 17'],
 ARRAY['W5'],
 ARRAY['wellLed'],
 ARRAY['residential', 'domiciliary', 'supported'],
 '# CQC Pre-Inspection Checklist

Use this checklist to ensure you are ready for an announced or unannounced CQC inspection.

## Documentation Ready

- [ ] Statement of Purpose available
- [ ] Registration certificate displayed
- [ ] Service user guide available
- [ ] Complaints policy accessible
- [ ] Latest CQC inspection report displayed
- [ ] Policies folder up to date and indexed

## Care Plans

- [ ] All care plans reviewed within last month
- [ ] Risk assessments current
- [ ] Consent forms signed and dated
- [ ] Mental Capacity Assessments where needed
- [ ] Daily notes up to date

## Staffing

- [ ] Rotas for last 3 months available
- [ ] Training matrix up to date
- [ ] DBS certificates on file
- [ ] Supervision records current (within 6-8 weeks)
- [ ] Staff files complete (Schedule 3)

## Medications

- [ ] MAR charts complete with no gaps
- [ ] CD register balanced
- [ ] Temperature logs complete
- [ ] Medication audit within last month
- [ ] PRN protocols in place

## Environment

- [ ] Fire safety records current
- [ ] Equipment maintenance up to date
- [ ] PAT testing in date
- [ ] Cleaning schedules completed
- [ ] Hand sanitiser available

## Safeguarding

- [ ] Safeguarding log up to date
- [ ] CQC notifications sent as required
- [ ] Staff aware of reporting procedures

## Governance

- [ ] Audits completed (medication, care plans, H&S)
- [ ] Action plans in progress
- [ ] Quality assurance meetings held
- [ ] Feedback sought from residents/families
- [ ] Incidents analysed with lessons learned

## On the Day

- [ ] Manager available or deputy briefed
- [ ] Key staff informed of inspection
- [ ] Refreshments available for inspector
- [ ] Private room for interviews
- [ ] Computer access for PIR if needed

---

**Completed by:** _________________

**Date:** _________________',
 false),

('Daily Environment Check',
 'Quick daily safety and hygiene check for the care environment.',
 'checklist',
 ARRAY['Reg 15'],
 ARRAY['S5'],
 ARRAY['safe'],
 ARRAY['residential'],
 '# Daily Environment Check

**Date:** _________________ **Shift:** AM / PM

**Completed by:** _________________

## General Areas

| Area | Clean | Safe | Hazards Noted | Action Taken |
|------|-------|------|---------------|--------------|
| Reception/Entrance | ☐ | ☐ | | |
| Corridors | ☐ | ☐ | | |
| Lounges | ☐ | ☐ | | |
| Dining Room | ☐ | ☐ | | |
| Garden/Outside | ☐ | ☐ | | |

## Safety Checks

- [ ] Fire exits clear and accessible
- [ ] Emergency lighting functional
- [ ] Call bells working
- [ ] Floor surfaces dry and non-slip
- [ ] All equipment stored safely
- [ ] No trailing wires

## Infection Control

- [ ] Hand sanitiser dispensers full
- [ ] PPE stations stocked
- [ ] Clinical waste bins not overflowing
- [ ] Cleaning equipment stored correctly

## Kitchen (if applicable)

- [ ] Fridge temperature 0-5°C: ___°C
- [ ] Freezer temperature -18°C or below: ___°C
- [ ] Food in date and stored correctly
- [ ] Surfaces clean

## Temperature Checks

- [ ] Medication room: ___°C (15-25°C)
- [ ] Medication fridge: ___°C (2-8°C)

## Issues Requiring Attention

| Issue | Location | Reported To | Time |
|-------|----------|-------------|------|
| | | | |

**Signature:** _________________',
 false);
