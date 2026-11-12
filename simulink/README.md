# RetinaGuard AI — SIH 2026 Operational Simulation Model
## Problem Statement 26038: Explainable AI for Diabetic Retinopathy Screening in Rural India

### 1. Objective & Model Scope
In rural Indian public healthcare systems (Primary Health Centres [PHCs] and Community Health Centres [CHCs]), diabetic retinopathy screening faces severe systemic constraints:
1. **Intermittent / Low-Bandwidth Connectivity**: 2G/3G or saturated rural 4G wireless networks (256–1024 kbps).
2. **High Screening Influx**: 30–50 diabetic subjects per PHC per day.
3. **Severe Specialist Scarcity**: Only ~25,000 ophthalmologists serve 1.4 billion people, with over 75% concentrated in urban tier-1/tier-2 hospitals.
4. **Referral Backlogs**: Triage delays lead to vision loss before tertiary referral can take place.

This simulation models the end-to-end discrete-event screening queue, network transmission delays, AI pipeline throughput, ophthalmologist review capacity, and backlog dynamics.

---

### 2. Mathematical Formulations

#### 2.1 Network Transmission Delay
The upload duration $T_{\text{upload}}$ for a fundus image of size $S_{\text{image}}$ (KB) over bandwidth $B$ (kbps):
$$T_{\text{upload}} = \frac{S_{\text{image}} \times 8}{B}$$

For a standard $2.2\,\text{MB}$ fundus photograph:
- Over **256 kbps (2G Edge)**: $T_{\text{upload}} = 68.75\,\text{seconds}$
- Over **512 kbps (3G Rural)**: $T_{\text{upload}} = 34.38\,\text{seconds}$
- Over **1024 kbps (Rural 4G)**: $T_{\text{upload}} = 17.19\,\text{seconds}$
- Over **4096 kbps (Broadband)**: $T_{\text{upload}} = 4.30\,\text{seconds}$

#### 2.2 End-to-End AI Screening Latency
The complete automated triage pipeline duration per patient:
$$T_{\text{AI}} = T_{\text{quality}} + T_{\text{preprocess}} + T_{\text{inference}} + T_{\text{gradcam}}$$
Typical timing on standard CPU hardware:
- Quality assessment: $\sim 0.35\,\text{s}$
- Preprocessing (CLAHE + crop): $\sim 0.45\,\text{s}$
- EfficientNet-B0 forward pass: $\sim 1.20\,\text{s}$
- Grad-CAM heatmap generation: $\sim 0.60\,\text{s}$
- **Total automated pipeline time**: $\approx 2.6\,\text{s}$ per image.

#### 2.3 Specialist Tele-ophthalmology Review Queue
Given daily patient cohort $N_{\text{screen}}$, expected referable diabetic retinopathy rate $P_{\text{referable}} \approx 22\text{--}25\%$:
$$N_{\text{referable}} = \lceil N_{\text{screen}} \times P_{\text{referable}} \rceil$$

For $D$ available ophthalmologists working $H$ hours with average review service time $T_{\text{review}}$ (minutes):
$$C_{\text{doctor}} = \left\lfloor \frac{D \times (H \times 60)}{T_{\text{review}}} \right\rfloor$$

The daily unreviewed backlog $Q_{\text{backlog}}$ at end of shift:
$$Q_{\text{backlog}} = \max(0, N_{\text{referable}} - C_{\text{doctor}})$$

---

### 3. MATLAB / Simulink Execution Instructions
To execute the MATLAB model:
1. Open MATLAB (R2022b or later).
2. Navigate to `simulink/` directory.
3. Run `retinaguard_screening_sim.m` in the command window.
4. Four analytical graphs will be generated displaying:
   - Hourly workload vs. review throughput
   - Specialist queue accumulation over an 8-hour shift
   - Network transmission latency across bandwidth scenarios
   - Required ophthalmologist staffing to eliminate backlogs

---

### 4. Interactive Simulation in the Web Application
RetinaGuard AI also provides a live operational simulation engine directly within the web dashboard under `/dashboard` and API endpoint `POST /api/simulation/run`. Healthcare administrators can dynamically adjust PHC numbers, patient influx, bandwidth, and staffing to assess operational readiness in real time.
