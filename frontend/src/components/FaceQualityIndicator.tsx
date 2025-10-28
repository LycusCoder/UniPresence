import React from 'react';

interface QualityMetrics {
  overall_score: number;
  blur_score: number;
  brightness_score: number;
  size_score: number;
  angle_score: number;
  face_dimensions?: {
    width: number;
    height: number;
  };
}

interface MaskDetection {
  detected: boolean;
  confidence: number;
  reason: string;
}

interface FaceQualityIndicatorProps {
  qualityMetrics?: QualityMetrics;
  maskDetection?: MaskDetection;
  recommendation?: string;
  isAcceptable?: boolean;
  showDetails?: boolean;
}

const FaceQualityIndicator: React.FC<FaceQualityIndicatorProps> = ({
  qualityMetrics,
  maskDetection,
  recommendation,
  isAcceptable,
  showDetails = false,
}) => {
  if (!qualityMetrics) return null;

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number): string => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getProgressColor = (score: number): string => {
    if (score >= 80) return 'bg-green-600';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-600';
  };

  const overallScore = qualityMetrics.overall_score;
  const maskDetected = maskDetection?.detected || false;

  return (
    <div className="space-y-3">
      {/* Overall Quality Score */}
      <div className={`p-4 rounded-lg ${getScoreBgColor(overallScore)} border-2 ${
        isAcceptable ? 'border-green-500' : 'border-red-500'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-800">Kualitas Wajah</h3>
          <span className={`text-2xl font-bold ${getScoreColor(overallScore)}`}>
            {overallScore.toFixed(0)}%
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full ${getProgressColor(overallScore)} transition-all duration-500`}
            style={{ width: `${overallScore}%` }}
          />
        </div>

        {/* Status */}
        <div className="mt-2 flex items-center gap-2">
          {isAcceptable ? (
            <>
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-green-700 font-medium">Kualitas Bagus</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-red-700 font-medium">Perbaiki Kualitas</span>
            </>
          )}
        </div>
      </div>

      {/* Mask Detection Warning */}
      {maskDetected && (
        <div className="p-4 bg-red-50 border-2 border-red-500 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-red-800 font-semibold mb-1">⚠️ Masker Terdeteksi!</h4>
              <p className="text-red-700 text-sm">
                Harap lepas masker untuk verifikasi wajah. Confidence: {maskDetection?.confidence.toFixed(0)}%
              </p>
              {maskDetection?.reason && (
                <p className="text-red-600 text-xs mt-1 italic">{maskDetection.reason}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recommendation */}
      {recommendation && (
        <div className={`p-3 rounded-lg ${
          isAcceptable ? 'bg-blue-50 border border-blue-200' : 'bg-yellow-50 border border-yellow-300'
        }`}>
          <p className={`text-sm ${
            isAcceptable ? 'text-blue-800' : 'text-yellow-800'
          }`}>
            <strong>Rekomendasi:</strong> {recommendation}
          </p>
        </div>
      )}

      {/* Detailed Metrics (Optional) */}
      {showDetails && (
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            label="Ketajaman"
            score={qualityMetrics.blur_score}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            }
          />
          <MetricCard
            label="Pencahayaan"
            score={qualityMetrics.brightness_score}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
          />
          <MetricCard
            label="Ukuran"
            score={qualityMetrics.size_score}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            }
          />
          <MetricCard
            label="Sudut"
            score={qualityMetrics.angle_score}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            }
          />
        </div>
      )}
    </div>
  );
};

interface MetricCardProps {
  label: string;
  score: number;
  icon: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, score, icon }) => {
  const getColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  return (
    <div className={`p-3 rounded-lg border ${getColor(score)}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="opacity-70">{icon}</span>
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="text-lg font-bold">{score.toFixed(0)}%</div>
      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
        <div
          className={`h-full rounded-full transition-all ${
            score >= 80 ? 'bg-green-600' : score >= 60 ? 'bg-yellow-500' : 'bg-red-600'
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
};

export default FaceQualityIndicator;
