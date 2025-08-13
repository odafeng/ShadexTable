/* AUTO-GENERATED from schemas.py */
import { z } from 'zod';

export const Table1AISummaryRequestSchema = z.object({
  data: z.string(),
});
export type Table1AISummaryRequest = z.infer<typeof Table1AISummaryRequestSchema>;

export const AnalysisRequestSchema = z.object({
  data: z.array(z.record(z.string(), z.unknown())),
  group_col: z.string().nullish(),
  cat_vars: z.array(z.string()),
  cont_vars: z.array(z.string()),
  fillNA: z.boolean().nullish().default(false),
  enableExport: z.boolean().nullish().default(false),
  enableAI: z.boolean().nullish().default(false),
});
export type AnalysisRequest = z.infer<typeof AnalysisRequestSchema>;

export const ColumnsProfileRequestSchema = z.object({
  data: z.array(z.record(z.string(), z.unknown())),
});
export type ColumnsProfileRequest = z.infer<typeof ColumnsProfileRequestSchema>;

export const ContactMessageRequestSchema = z.object({
  name: z.string().nullish().default(""),
  email: z.string().nullish().default(""),
  message: z.string().nullish().default(""),
});
export type ContactMessageRequest = z.infer<typeof ContactMessageRequestSchema>;

export const AIDiagnosisRequestSchema = z.object({
  columns: z.array(z.record(z.string(), z.unknown())),
});
export type AIDiagnosisRequest = z.infer<typeof AIDiagnosisRequestSchema>;

export const PreprocessColumnsRequestSchema = z.object({
  data: z.array(z.record(z.string(), z.unknown())),
});
export type PreprocessColumnsRequest = z.infer<typeof PreprocessColumnsRequestSchema>;

export const ColumnDataSchema = z.object({
  column: z.string(),
  missing_pct: z.union([z.string(), z.number()]),
  suggested_type: z.string(),
  outlier_pct: z.union([z.string(), z.number()]).nullish(),
});
export type ColumnData = z.infer<typeof ColumnDataSchema>;

export const MissingFillRequestSchema = z.object({
  columns: z.array(z.any()),
  data: z.array(z.record(z.string(), z.unknown())),
  cont_vars: z.array(z.string()),
  cat_vars: z.array(z.string()),
  group_col: z.string(),
});
export type MissingFillRequest = z.infer<typeof MissingFillRequestSchema>;

export const DataPayloadSchema = z.object({
  parsedData: z.array(z.record(z.string(), z.unknown())),
  fillNA: z.boolean().nullish().default(false),
});
export type DataPayload = z.infer<typeof DataPayloadSchema>;

export const SurvAnalyzeRequestSchema = z.object({
  data: z.array(z.record(z.string(), z.unknown())),
  time_col: z.string(),
  event_col: z.string(),
  group_col: z.string().nullish(),
  fill_na: z.boolean().nullish().default(true),
  test_method: z.string().nullish().default("logrank"),
  group_order: z.array(z.string()).nullish(),
  group_labels: z.array(z.string()).nullish(),
});
export type SurvAnalyzeRequest = z.infer<typeof SurvAnalyzeRequestSchema>;

export const KMPlotRequestSchema = z.object({
  data: z.array(z.record(z.string(), z.unknown())),
  time_col: z.string(),
  event_col: z.string(),
  group_col: z.string().nullish(),
  show_ci: z.boolean().nullish().default(false),
  show_grid: z.boolean().nullish().default(false),
  group_order: z.array(z.string()).nullish(),
  group_labels: z.record(z.string(), z.unknown()).nullish(),
  xlabel: z.string().nullish().default("Time"),
  ylabel: z.string().nullish().default("Survival Probability"),
  title: z.string().nullish().default("Kaplan-Meier Curve"),
  legend_loc: z.string().nullish().default("best"),
  show_marks: z.boolean().nullish().default(true),
  show_p_values: z.boolean().nullish().default(true),
  p_label_position: z.string().nullish().default("lower right"),
  show_5y_aidline: z.boolean().nullish().default(false),
  pubmode: z.boolean().nullish().default(false),
  show_risk_table: z.boolean().nullish().default(true),
});
export type KMPlotRequest = z.infer<typeof KMPlotRequestSchema>;

export const CoxUnivariateRequestSchema = z.object({
  data: z.array(z.record(z.string(), z.unknown())),
  time_col: z.string(),
  event_col: z.string().nullish(),
  outcome_col: z.string().nullish(),
  variables: z.array(z.string()),
  group_col: z.string(),
  cat_vars: z.array(z.string()).default([]),
  cont_vars: z.array(z.string()).default([]),
  missing_strategy: z.string().nullish(),
  group_continuous: z.array(z.string()).nullish(),
  group_thresholds: z.record(z.string(), z.unknown()).nullish(),
});
export type CoxUnivariateRequest = z.infer<typeof CoxUnivariateRequestSchema>;

export const CoxVariableResultSchema = z.object({
  variable: z.string(),
  hazard_ratio: z.number(),
  ci_lower: z.number(),
  ci_upper: z.number(),
  p_value: z.number(),
});
export type CoxVariableResult = z.infer<typeof CoxVariableResultSchema>;

export const CoxUnivariateResponseSchema = z.object({
  results: z.array(z.any()),
  baselines: z.array(z.record(z.string(), z.unknown())).nullish(),
});
export type CoxUnivariateResponse = z.infer<typeof CoxUnivariateResponseSchema>;

export const StandardResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.union([z.record(z.string(), z.unknown()), z.array(z.any())]).nullish(),
  error_code: z.number().int().nullish(),
});
export type StandardResponse = z.infer<typeof StandardResponseSchema>;

export const ModelConfigSchema = z.object({
  method: z.enum(["enter", "forward", "backward", "stepwise"]),
  p_enter: z.number(),
  p_remove: z.number(),
  max_iterations: z.number().int().default(50),
  tolerance: z.number().default(1e-6),
});
export type ModelConfig = z.infer<typeof ModelConfigSchema>;

export const CoxMultivariateRequestSchema = z.object({
  data: z.array(z.record(z.string(), z.unknown())),
  time_col: z.string(),
  event_col: z.string(),
  variables: z.array(z.string()),
  cont_vars: z.array(z.string()).default([]),
  cat_vars: z.array(z.string()).default([]),
  group_col: z.string().nullish(),
  model_options: z.any(),
});
export type CoxMultivariateRequest = z.infer<typeof CoxMultivariateRequestSchema>;

export const AIVariableSelectionRequestSchema = z.object({
  variables: z.array(z.record(z.string(), z.unknown())),
  time_col: z.string(),
  event_col: z.string(),
  significant_variables: z.array(z.string()).nullish(),
});
export type AIVariableSelectionRequest = z.infer<typeof AIVariableSelectionRequestSchema>;

export const StudyInfoSchema = z.object({
  time_col: z.string(),
  event_col: z.string(),
  group_col: z.string().nullish(),
  sample_size: z.number().int(),
  selected_variables: z.array(z.string()).nullish(),
});
export type StudyInfo = z.infer<typeof StudyInfoSchema>;

export const KMResultsSchema = z.object({
  logrank_p: z.number().nullish(),
  summary_table: z.record(z.string(), z.unknown()).nullish(),
  km_table: z.union([z.array(z.record(z.string(), z.unknown())), z.record(z.string(), z.unknown()), z.array(z.any())]).nullish(),
  groups: z.array(z.string()).nullish().default([]),
  median_survival: z.record(z.string(), z.unknown()).nullish(),
});
export type KMResults = z.infer<typeof KMResultsSchema>;

export const UnivariateResultSchema = z.object({
  variable: z.string(),
  hazard_ratio: z.number(),
  ci_lower: z.number(),
  ci_upper: z.number(),
  p_value: z.number(),
  std_error: z.number().nullish(),
});
export type UnivariateResult = z.infer<typeof UnivariateResultSchema>;

export const BaselineInfoSchema = z.object({
  variable: z.string(),
  baseline: z.string(),
});
export type BaselineInfo = z.infer<typeof BaselineInfoSchema>;

export const UnivariateResultsSchema = z.object({
  results: z.array(z.any()),
  baselines: z.array(z.any()).nullish(),
  significant_variables: z.array(z.any()).nullish(),
  total_variables: z.number().int().nullish(),
});
export type UnivariateResults = z.infer<typeof UnivariateResultsSchema>;

export const MultivariateResultSchema = z.object({
  variable: z.string(),
  hazard_ratio: z.number(),
  ci_lower: z.number(),
  ci_upper: z.number(),
  p_value: z.number(),
  std_error: z.number().nullish(),
  z_score: z.number().nullish(),
});
export type MultivariateResult = z.infer<typeof MultivariateResultSchema>;

export const ModelSummarySchema = z.object({
  concordance_index: z.number().nullish(),
  log_likelihood: z.number().nullish(),
  aic: z.number().nullish(),
  bic: z.number().nullish(),
  n_observations: z.number().int().nullish(),
  n_events: z.number().int().nullish(),
});
export type ModelSummary = z.infer<typeof ModelSummarySchema>;

export const MultivariateResultsSchema = z.object({
  results: z.array(z.any()),
  baselines: z.array(z.any()).nullish(),
  model_summary: z.any().nullish(),
  selection_method: z.string().nullish().default("enter"),
  final_variables: z.array(z.string()).nullish().default([]),
});
export type MultivariateResults = z.infer<typeof MultivariateResultsSchema>;

export const AIAnalysisRequestSchema = z.object({
  study_info: z.any(),
  km_results: z.any().nullish(),
  univariate_results: z.any().nullish(),
  multivariate_results: z.any().nullish(),
  analysis_type: z.string(),
  language: z.string().default("zh-TW"),
});
export type AIAnalysisRequest = z.infer<typeof AIAnalysisRequestSchema>;

export const StatisticalInterpretationSchema = z.object({
  main_findings: z.string(),
  survival_analysis: z.string().nullish(),
  cox_regression: z.string().nullish(),
  model_performance: z.string().nullish(),
  statistical_significance: z.string(),
  effect_sizes: z.string().nullish(),
});
export type StatisticalInterpretation = z.infer<typeof StatisticalInterpretationSchema>;

export const ClinicalInterpretationSchema = z.object({
  prognostic_factors: z.string(),
  clinical_significance: z.string(),
  risk_stratification: z.string().nullish(),
  clinical_applications: z.string(),
  patient_counseling: z.string().nullish(),
});
export type ClinicalInterpretation = z.infer<typeof ClinicalInterpretationSchema>;

export const MethodologicalNotesSchema = z.object({
  study_limitations: z.array(z.string()),
  statistical_assumptions: z.array(z.string()),
  model_assumptions: z.array(z.string()),
  sample_size_adequacy: z.string(),
  missing_data_impact: z.string().nullish(),
});
export type MethodologicalNotes = z.infer<typeof MethodologicalNotesSchema>;

export const FutureDirectionsSchema = z.object({
  research_recommendations: z.array(z.string()),
  validation_needs: z.array(z.string()),
  clinical_trial_implications: z.string().nullish(),
  biomarker_development: z.string().nullish(),
});
export type FutureDirections = z.infer<typeof FutureDirectionsSchema>;

export const ResultsSummarySchema = z.object({
  executive_summary: z.string(),
  key_findings: z.array(z.string()),
  statistical_summary: z.string(),
  clinical_summary: z.string(),
  conclusions: z.string(),
});
export type ResultsSummary = z.infer<typeof ResultsSummarySchema>;

export const AIAnalysisResponseSchema = z.object({
  statistical_interpretation: z.any(),
  clinical_interpretation: z.any(),
  methodological_notes: z.any(),
  future_directions: z.any(),
  results_summary: z.any(),
  analysis_quality: z.string(),
  recommendations: z.array(z.string()),
  generated_at: z.string().datetime().or(z.date()).default(() => new Date().toISOString()),
});
export type AIAnalysisResponse = z.infer<typeof AIAnalysisResponseSchema>;

export const AIInterpretationRequestSchema = z.object({
  study_info: z.any(),
  km_results: z.any().nullish(),
  univariate_results: z.any().nullish(),
  multivariate_results: z.any().nullish(),
  focus_areas: z.array(z.string()).nullish().default([]),
});
export type AIInterpretationRequest = z.infer<typeof AIInterpretationRequestSchema>;

export const AIInterpretationResponseSchema = z.object({
  statistical_interpretation: z.any(),
  clinical_interpretation: z.any(),
  methodological_notes: z.any(),
  generated_at: z.string().datetime().or(z.date()).default(() => new Date().toISOString()),
});
export type AIInterpretationResponse = z.infer<typeof AIInterpretationResponseSchema>;

export const AISummaryRequestSchema = z.object({
  study_info: z.any(),
  km_results: z.any().nullish(),
  univariate_results: z.any().nullish(),
  multivariate_results: z.any().nullish(),
  summary_type: z.string().default("comprehensive"),
  target_audience: z.string().default("clinical"),
});
export type AISummaryRequest = z.infer<typeof AISummaryRequestSchema>;

export const AISummaryResponseSchema = z.object({
  results_summary: z.any(),
  future_directions: z.any(),
  recommendations: z.array(z.string()),
  generated_at: z.string().datetime().or(z.date()).default(() => new Date().toISOString()),
});
export type AISummaryResponse = z.infer<typeof AISummaryResponseSchema>;

export const MissingFillStrategySchema = z.object({
  column: z.string(),
  method: z.enum(["mean", "median", "mode", "knn", "delete_column"]),
  column_type: z.string(),
});
export type MissingFillStrategy = z.infer<typeof MissingFillStrategySchema>;

export const SelfDefinedMissingFillRequestSchema = z.object({
  data: z.array(z.record(z.string(), z.unknown())),
  strategies: z.array(z.any()),
  cont_vars: z.array(z.string()),
  cat_vars: z.array(z.string()),
});
export type SelfDefinedMissingFillRequest = z.infer<typeof SelfDefinedMissingFillRequestSchema>;

export const AIProcessingOptionsSchema = z.object({
  handle_missing_values: z.boolean().default(true),
  missing_threshold: z.number(),
  handle_outliers: z.boolean().default(true),
  outlier_threshold: z.number(),
  dummy_encoding: z.boolean().default(true),
  auto_baseline_selection: z.boolean(),
  vif_check: z.boolean().default(true),
  vif_threshold: z.number().default(10.0),
  interaction_detection: z.boolean().default(true),
  interaction_threshold: z.number(),
  max_interactions: z.number().int(),
});
export type AIProcessingOptions = z.infer<typeof AIProcessingOptionsSchema>;

export const QualitySettingsSchema = z.object({
  completeness_threshold: z.number(),
  accuracy_threshold: z.number(),
  consistency_threshold: z.number(),
});
export type QualitySettings = z.infer<typeof QualitySettingsSchema>;

export const AIProcessingRequestSchema = z.object({
  data: z.array(z.record(z.string(), z.unknown())),
  target_col: z.string(),
  cat_vars: z.array(z.string()).default([]),
  cont_vars: z.array(z.string()).default([]),
  processing_options: z.any(),
  quality_settings: z.any(),
});
export type AIProcessingRequest = z.infer<typeof AIProcessingRequestSchema>;

export const ProcessingStepSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  status: z.enum(["pending", "processing", "completed", "error"]),
  details: z.string().nullish(),
  count: z.number().int().nullish(),
  start_time: z.string().datetime().or(z.date()).nullish(),
  end_time: z.string().datetime().or(z.date()).nullish(),
});
export type ProcessingStep = z.infer<typeof ProcessingStepSchema>;

export const ProcessingSummarySchema = z.object({
  total_rows_processed: z.number().int(),
  initial_rows: z.number().int(),
  missing_values_filled: z.number().int(),
  columns_removed: z.array(z.string()),
  outliers_removed: z.number().int(),
  dummy_encoded_variables: z.array(z.string()),
  vif_removed_variables: z.array(z.string()),
  interaction_variables_added: z.array(z.string()),
});
export type ProcessingSummary = z.infer<typeof ProcessingSummarySchema>;

export const QualityImprovementSchema = z.object({
  before_score: z.number(),
  after_score: z.number(),
  improvement_percentage: z.number(),
});
export type QualityImprovement = z.infer<typeof QualityImprovementSchema>;

export const AIProcessingResponseSchema = z.object({
  success: z.boolean(),
  processed_data: z.array(z.record(z.string(), z.unknown())),
  processing_summary: z.any(),
  quality_improvement: z.any(),
  message: z.string(),
  error: z.string().nullish(),
  processing_steps: z.array(z.any()),
});
export type AIProcessingResponse = z.infer<typeof AIProcessingResponseSchema>;

export const DataQualityRequestSchema = z.object({
  data: z.array(z.record(z.string(), z.unknown())),
  config: z.record(z.string(), z.unknown()).nullish(),
});
export type DataQualityRequest = z.infer<typeof DataQualityRequestSchema>;

export const OutlierDetectionRequestSchema = z.object({
  data: z.array(z.record(z.string(), z.unknown())),
  column: z.string(),
  method: z.enum(["auto", "iqr", "zscore", "isolation_forest"]),
  contamination: z.number().default(0.1),
});
export type OutlierDetectionRequest = z.infer<typeof OutlierDetectionRequestSchema>;

export const FormulaColumnRequestSchema = z.object({
  data: z.array(z.record(z.string(), z.unknown())),
  new_column_name: z.string(),
  formula: z.string(),
});
export type FormulaColumnRequest = z.infer<typeof FormulaColumnRequestSchema>;

export const LogisticUnivariateRequestSchema = z.object({
  data: z.array(z.record(z.string(), z.unknown())),
  target_col: z.string(),
  predictors: z.array(z.string()),
  cat_vars: z.array(z.string()).default([]),
  cont_vars: z.array(z.string()).default([]),
  missing_strategy: z.enum(["listwise", "pairwise"]),
  confidence_level: z.number(),
  convergence_criteria: z.record(z.string(), z.unknown()).nullish(),
});
export type LogisticUnivariateRequest = z.infer<typeof LogisticUnivariateRequestSchema>;

export const LogisticVariableResultSchema = z.object({
  variable: z.string(),
  coefficient: z.number(),
  std_error: z.number(),
  odds_ratio: z.number(),
  ci_lower: z.number(),
  ci_upper: z.number(),
  z_statistic: z.number(),
  p_value: z.number(),
  n_observations: z.number().int(),
  n_events: z.number().int(),
  aic: z.number(),
  bic: z.number(),
});
export type LogisticVariableResult = z.infer<typeof LogisticVariableResultSchema>;

export const LogisticUnivariateResponseSchema = z.object({
  results: z.array(z.any()),
  baselines: z.array(z.record(z.string(), z.unknown())).nullish(),
  model_info: z.record(z.string(), z.unknown()),
  data_summary: z.record(z.string(), z.unknown()),
});
export type LogisticUnivariateResponse = z.infer<typeof LogisticUnivariateResponseSchema>;

export const LinearUnivariateRequestSchema = z.object({
  data: z.array(z.record(z.string(), z.unknown())),
  target_col: z.string(),
  predictors: z.array(z.string()),
  cat_vars: z.array(z.string()).default([]),
  cont_vars: z.array(z.string()).default([]),
  missing_strategy: z.enum(["listwise", "pairwise"]),
  confidence_level: z.number(),
  diagnostics: z.boolean().default(true),
});
export type LinearUnivariateRequest = z.infer<typeof LinearUnivariateRequestSchema>;

export const LinearVariableResultSchema = z.object({
  variable: z.string(),
  coefficient: z.number(),
  std_error: z.number(),
  ci_lower: z.number(),
  ci_upper: z.number(),
  t_statistic: z.number(),
  p_value: z.number(),
  r_squared: z.number(),
  adj_r_squared: z.number(),
  f_statistic: z.number(),
  f_p_value: z.number(),
  n_observations: z.number().int(),
  aic: z.number(),
  bic: z.number(),
  rmse: z.number(),
  mae: z.number(),
});
export type LinearVariableResult = z.infer<typeof LinearVariableResultSchema>;

export const LinearDiagnosticsSchema = z.object({
  variable: z.string(),
  durbin_watson: z.number(),
  jarque_bera: z.number(),
  jarque_bera_p: z.number(),
  breusch_pagan: z.number(),
  breusch_pagan_p: z.number(),
  condition_number: z.number(),
  vif: z.number().nullish(),
});
export type LinearDiagnostics = z.infer<typeof LinearDiagnosticsSchema>;

export const LinearUnivariateResponseSchema = z.object({
  results: z.array(z.any()),
  baselines: z.array(z.record(z.string(), z.unknown())).nullish(),
  diagnostics: z.array(z.any()).nullish(),
  model_info: z.record(z.string(), z.unknown()),
  data_summary: z.record(z.string(), z.unknown()),
});
export type LinearUnivariateResponse = z.infer<typeof LinearUnivariateResponseSchema>;

export const PreprocessingStepSchema = z.object({
  step_name: z.string(),
  description: z.string(),
  affected_columns: z.array(z.string()),
  parameters: z.record(z.string(), z.unknown()).nullish(),
  statistics: z.record(z.string(), z.unknown()).nullish(),
});
export type PreprocessingStep = z.infer<typeof PreprocessingStepSchema>;

export const PreprocessingSummarySchema = z.object({
  total_samples: z.number().int(),
  total_features: z.number().int(),
  final_samples: z.number().int(),
  final_features: z.number().int(),
  categorical_variables: z.array(z.string()).default([]),
  continuous_variables: z.array(z.string()).default([]),
  target_variable: z.string().nullish(),
  missing_value_handling: z.record(z.string(), z.unknown()).nullish(),
  outlier_handling: z.record(z.string(), z.unknown()).nullish(),
  feature_engineering: z.record(z.string(), z.unknown()).nullish(),
  data_cleaning: z.record(z.string(), z.unknown()).nullish(),
  processing_steps: z.array(z.any()),
  software_info: z.record(z.string(), z.unknown()).nullish(),
});
export type PreprocessingSummary = z.infer<typeof PreprocessingSummarySchema>;

export const GenerateMethodsRequestSchema = z.object({
  preprocessing_summary: z.any(),
  language: z.string(),
  style: z.string(),
  include_statistics: z.boolean(),
  include_software: z.boolean(),
  journal_style: z.string().nullish(),
});
export type GenerateMethodsRequest = z.infer<typeof GenerateMethodsRequestSchema>;

export const GenerateMethodsResponseSchema = z.object({
  methods_text: z.string(),
  word_count: z.number().int(),
  sections: z.array(z.record(z.string(), z.unknown())).nullish(),
  metadata: z.record(z.string(), z.unknown()).nullish(),
});
export type GenerateMethodsResponse = z.infer<typeof GenerateMethodsResponseSchema>;

export const LogisticRegressionRequestSchema = z.object({
  data: z.array(z.record(z.string(), z.unknown())),
  target_col: z.string(),
  predictors: z.array(z.string()),
  cat_vars: z.array(z.string()).default([]),
  cont_vars: z.array(z.string()).default([]),
  missing_strategy: z.enum(["listwise", "simple_impute"]),
  scaling_method: z.enum(["zscore", "none"]),
  confidence_level: z.number().default(0.95),
  variable_selection_method: z.enum(["enter", "forward", "backward", "stepwise"]),
  p_enter: z.number().default(0.05),
  p_remove: z.number().default(0.10),
  max_iterations: z.number().int().default(100),
  tolerance: z.number().default(1e-8),
});
export type LogisticRegressionRequest = z.infer<typeof LogisticRegressionRequestSchema>;

export const LinearRegressionRequestSchema = z.object({
  data: z.array(z.record(z.string(), z.unknown())),
  target_col: z.string(),
  predictors: z.array(z.string()),
  cat_vars: z.array(z.string()).default([]),
  cont_vars: z.array(z.string()).default([]),
  missing_strategy: z.enum(["listwise", "simple_impute"]),
  scaling_method: z.enum(["zscore", "none"]),
  confidence_level: z.number().default(0.95),
  variable_selection_method: z.enum(["enter", "forward", "backward", "stepwise"]),
  p_enter: z.number().default(0.05),
  p_remove: z.number().default(0.10),
  diagnostics: z.boolean().default(true),
});
export type LinearRegressionRequest = z.infer<typeof LinearRegressionRequestSchema>;

export const CoefficientInfoSchema = z.object({
  variable: z.string(),
  coefficient: z.number(),
  std_error: z.number(),
  statistic: z.number(),
  p_value: z.number(),
  ci_lower: z.number(),
  ci_upper: z.number(),
  significance: z.string(),
  odds_ratio: z.number().nullish(),
  odds_ratio_ci_lower: z.number().nullish(),
  odds_ratio_ci_upper: z.number().nullish(),
});
export type CoefficientInfo = z.infer<typeof CoefficientInfoSchema>;

export const RegressionModelSummarySchema = z.object({
  n_observations: z.number().int(),
  df_residuals: z.number().int(),
  df_model: z.number().int(),
  method: z.string(),
  n_events: z.number().int().nullish(),
  log_likelihood: z.number().nullish(),
  aic: z.number(),
  bic: z.number(),
  pseudo_r_squared: z.number().nullish(),
  r_squared: z.number().nullish(),
  adj_r_squared: z.number().nullish(),
  f_statistic: z.number().nullish(),
  f_p_value: z.number().nullish(),
});
export type RegressionModelSummary = z.infer<typeof RegressionModelSummarySchema>;

export const GoodnessOfFitSchema = z.object({
  test_name: z.string(),
  statistic: z.number(),
  p_value: z.number(),
  df: z.number().int().nullish(),
});
export type GoodnessOfFit = z.infer<typeof GoodnessOfFitSchema>;

export const DiagnosticStatsSchema = z.object({
  durbin_watson: z.number(),
  condition_number: z.number(),
  vif: z.record(z.string(), z.unknown()),
  jarque_bera: z.any(),
  breusch_pagan: z.any(),
});
export type DiagnosticStats = z.infer<typeof DiagnosticStatsSchema>;

export const VariableSelectionStepSchema = z.object({
  step: z.number().int(),
  action: z.enum(["add", "remove", "initial"]),
  variable: z.string().nullish(),
  statistic: z.number().nullish(),
  p_value: z.number().nullish(),
  model_criterion: z.number().nullish(),
  variables_in_model: z.array(z.string()),
});
export type VariableSelectionStep = z.infer<typeof VariableSelectionStepSchema>;

export const LogisticRegressionResultSchema = z.object({
  coefficients: z.array(z.any()),
  model_summary: z.any(),
  goodness_of_fit: z.array(z.any()),
  final_variables: z.array(z.string()),
  selection_steps: z.array(z.any()).nullish(),
  classification_metrics: z.record(z.string(), z.unknown()).nullish(),
});
export type LogisticRegressionResult = z.infer<typeof LogisticRegressionResultSchema>;

export const LinearRegressionResultSchema = z.object({
  coefficients: z.array(z.any()),
  model_summary: z.any(),
  diagnostics: z.any().nullish(),
  final_variables: z.array(z.string()),
  selection_steps: z.array(z.any()).nullish(),
});
export type LinearRegressionResult = z.infer<typeof LinearRegressionResultSchema>;

export const RecommendVarsRequestSchema = z.object({
  data: z.array(z.record(z.string(), z.unknown())),
  target_col: z.string(),
  features_all: z.array(z.string()),
  cat_vars: z.array(z.string()),
  cont_vars: z.array(z.string()),
  exclude_vars: z.array(z.string()),
  preferred_model: z.enum(["logistic", "linear"]).nullish(),
  prior_selected_vars: z.array(z.string()),
  language: z.enum(["en", "zh-TW"]),
  openai_model: z.string().nullish(),
  temperature: z.number(),
  max_tokens: z.number().int(),
});
export type RecommendVarsRequest = z.infer<typeof RecommendVarsRequestSchema>;

export const RecommendVarsResultSchema = z.object({
  model_type: z.enum(["logistic", "linear"]),
  target_col: z.string(),
  selected_vars: z.array(z.string()),
  rationale: z.string(),
  notices: z.array(z.string()),
});
export type RecommendVarsResult = z.infer<typeof RecommendVarsResultSchema>;