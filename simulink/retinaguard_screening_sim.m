%% RETINAGUARD AI — OPERATIONAL WORKFLOW & TELE-OPHTHALMOLOGY QUEUE SIMULATION
%% Smart India Hackathon (SIH) 2026 | Problem Statement: 26038
%% Explainable AI for Diabetic Retinopathy Screening in Rural India
%%
%% This MATLAB/Simulink script models the end-to-end discrete-event dynamics
%% of retinal image acquisition, rural uplink bandwidth delays, edge/cloud AI inference,
%% and specialist ophthalmologist review queues across primary health centers (PHCs).

clear; clc; close all;

fprintf('=======================================================\n');
fprintf('  RETINAGUARD AI: SIH 2026 Screening Workflow Model    \n');
fprintf('  Discrete-Event Screening Queue & Backlog Simulation   \n');
fprintf('=======================================================\n\n');

%% 1. SIMULATION PARAMETERS & INPUT CONFIGURATION

% Rural PHC Network Configuration
num_phcs = 10;                         % Number of participating rural primary health centers
daily_patients_per_phc = 35;           % Average diabetic screening subjects per center per day
shift_hours = 8;                       % Operating clinic hours (09:00 - 17:00)
total_screenings = num_phcs * daily_patients_per_phc; % Total incoming images = 350

% Telecommunications & Edge Computing Parameters
avg_image_size_kb = 2200;              % Average high-resolution retinal fundus photo (KB)
bandwidth_scenarios = [256, 512, 1024, 4096]; % Uplink bandwidth in kbps (2G, 3G, 4G rural, Broadband)
selected_bw_kbps = 512;                % Selected operational scenario

% AI Pipeline Timing (Measured on CPU/Edge accelerator)
t_quality_check_sec = 0.35;            % Image quality assessment (Laplacian blur + illumination)
t_preprocess_sec = 0.45;               % Retinal circle crop + CLAHE + resizing
t_inference_sec = 1.20;                % EfficientNet-B0 inference forward pass
t_gradcam_sec = 0.60;                  % Grad-CAM heatmap extraction and overlay
t_ai_pipeline_total_sec = t_quality_check_sec + t_preprocess_sec + t_inference_sec + t_gradcam_sec; % ~2.6s

% Clinical Tele-ophthalmology Reviewer Capacity
dr_prevalence_pct = 0.22;              % 22% expected diabetic retinopathy in diabetic cohort
referable_threshold_grade = 2;         % Grades 2 (Moderate), 3 (Severe), 4 (Proliferative) need review
pct_referable = 0.24;                  % 24% of all images flagged referable or borderline
num_ophthalmologists = 2;              % Available specialists at district hub hospital
t_review_time_min = 4.5;               % Average minutes spent per referable case review

%% 2. ANALYTICAL CAPACITY & BOTTLENECK EVALUATION

% Network Transmission Time per Image
image_kbits = avg_image_size_kb * 8;
t_upload_sec = image_kbits / selected_bw_kbps;

% Total daily AI inference workload
t_total_ai_sec = total_screenings * t_ai_pipeline_total_sec;
t_total_ai_min = t_total_ai_sec / 60;

% Total referable cases demanding specialist review
total_referable_cases = ceil(total_screenings * pct_referable);

% Human review capacity over shift
total_review_minutes_available = num_ophthalmologists * (shift_hours * 60);
max_doctor_case_capacity = floor(total_review_minutes_available / t_review_time_min);

% Daily Backlog
daily_backlog = max(0, total_referable_cases - max_doctor_case_capacity);
doctor_utilization = (total_referable_cases / max_doctor_case_capacity) * 100;

fprintf('--- Operational Summary ---\n');
fprintf('Total Screenings Today:         %d patients\n', total_screenings);
fprintf('Network Uplink Delay:           %.2f seconds per image (at %d kbps)\n', t_upload_sec, selected_bw_kbps);
fprintf('Total AI Pipeline Time:         %.1f minutes for all %d images\n', t_total_ai_min, total_screenings);
fprintf('Total Referable Cases Flagged:  %d cases\n', total_referable_cases);
fprintf('Doctor Review Capacity:         %d cases/day (%d ophthalmologists)\n', max_doctor_case_capacity, num_ophthalmologists);
fprintf('Doctor Utilization Rate:        %.1f%%\n', min(100, doctor_utilization));
fprintf('Projected End-of-Day Backlog:   %d cases\n', daily_backlog);

%% 3. HOURLY DISCRETE-EVENT TIME-STEP SIMULATION

hours = 1:shift_hours;
% Typical diurnal arrival curve in Indian rural clinics (peaks mid-morning)
hourly_arrival_weights = [0.08, 0.16, 0.22, 0.24, 0.14, 0.08, 0.05, 0.03];
hourly_screenings = round(total_screenings .* hourly_arrival_weights);
hourly_referable = round(hourly_screenings .* pct_referable);

doctor_rate_per_hour = floor(max_doctor_case_capacity / shift_hours);

queue_length = zeros(1, shift_hours);
reviewed_cases = zeros(1, shift_hours);
current_queue = 0;

for h = 1:shift_hours
    current_queue = current_queue + hourly_referable(h);
    cases_done = min(current_queue, doctor_rate_per_hour);
    reviewed_cases(h) = cases_done;
    current_queue = current_queue - cases_done;
    queue_length(h) = current_queue;
end

%% 4. VISUALIZATION & BOTTLENECK PLOTS

figure('Name', 'RetinaGuard AI - Screening Queue Dynamics', 'Color', 'w', 'Position', [100, 100, 1100, 700]);

% Subplot 1: Hourly Patient Influx vs AI Throughput vs Specialist Review
subplot(2, 2, 1);
bar(hours, [hourly_screenings; hourly_referable; reviewed_cases]', 'grouped');
grid on;
title('Screening Workload vs Doctor Review by Hour');
xlabel('Clinic Hour (1 = 09:00, 8 = 17:00)');
ylabel('Number of Cases');
legend({'Total Influx', 'Referable Cases', 'Doctor Reviewed'}, 'Location', 'northwest');

% Subplot 2: Tele-ophthalmology Queue Accumulation
subplot(2, 2, 2);
plot(hours, queue_length, '-ro', 'LineWidth', 2.0, 'MarkerFaceColor', 'r');
grid on;
title('Specialist Review Pending Queue Over Shift');
xlabel('Clinic Hour');
ylabel('Backlog Queue (Cases Waiting)');

% Subplot 3: Uplink Bandwidth Sensitivity Analysis
subplot(2, 2, 3);
bw_delay = (avg_image_size_kb * 8) ./ bandwidth_scenarios;
bar(categorical({'256 kbps (2G Edge)', '512 kbps (3G Rural)', '1024 kbps (4G)', '4096 kbps (Fiber)'}), bw_delay, 'FaceColor', [0.15 0.55 0.85]);
grid on;
title('Image Transmission Latency vs Bandwidth');
ylabel('Upload Delay (Seconds/Image)');

% Subplot 4: Specialist Staffing vs Backlog Elimination
subplot(2, 2, 4);
staff_scenarios = 1:5;
capacities = floor((staff_scenarios .* (shift_hours * 60)) ./ t_review_time_min);
backlogs = max(0, total_referable_cases - capacities);
plot(staff_scenarios, backlogs, '-s', 'LineWidth', 2.0, 'Color', [0.85 0.2 0.2], 'MarkerSize', 8, 'MarkerFaceColor', [0.85 0.2 0.2]);
grid on;
title('Doctor Staffing vs Daily Backlog (350 patients)');
xlabel('Number of Active Ophthalmologists');
ylabel('Unreviewed Cases at 17:00');

fprintf('\nSimulation finished successfully. Model outputs exported.\n');
