import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, User, Building2, Briefcase, Calendar, QrCode } from 'lucide-react';

interface ECardProps {
  employee: {
    employee_id: string;
    name: string;
    department?: string;
    position?: string;
    photo?: string;
  };
  qrCodeData: string;
  onDownload?: () => void;
}

const ECard: React.FC<ECardProps> = ({ employee, qrCodeData, onDownload }) => {
  const currentYear = new Date().getFullYear();

  const handleDownloadCard = () => {
    if (onDownload) {
      onDownload();
    } else {
      // Default download behavior
      const cardElement = document.getElementById('e-card-download');
      if (cardElement) {
        // Here you would implement html-to-image or similar
        alert('Download functionality will be implemented with html2canvas');
      }
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* E-Card */}
      <div 
        id="e-card-download"
        className="relative w-full max-w-md bg-gradient-to-br from-white via-gray-50 to-blue-50 rounded-3xl shadow-2xl overflow-hidden border-2 border-gray-200"
      >
        {/* Header with Logo */}
        <div className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h2 className="text-white font-bold text-xl mb-1">UniPresence</h2>
              <p className="text-red-100 text-sm">Employee ID Card</p>
            </div>
            <div className="h-14 w-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
              <User className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-6">
          <div className="flex gap-6">
            {/* Photo Section */}
            <div className="flex-shrink-0">
              <div className="h-32 w-32 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl flex items-center justify-center border-4 border-white shadow-lg overflow-hidden">
                {employee.photo ? (
                  <img 
                    src={employee.photo} 
                    alt={employee.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-16 h-16 text-gray-400" />
                )}
              </div>
            </div>

            {/* Employee Info */}
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1 leading-tight">
                  {employee.name}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Briefcase className="w-4 h-4" />
                  <span className="font-mono font-semibold">{employee.employee_id}</span>
                </div>
              </div>

              <div className="space-y-2">
                {employee.department && (
                  <div className="flex items-start gap-2 text-sm">
                    <Building2 className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 font-medium leading-tight">{employee.department}</span>
                  </div>
                )}
                {employee.position && (
                  <div className="flex items-start gap-2 text-sm">
                    <Briefcase className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 font-medium leading-tight">{employee.position}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <QrCode className="w-5 h-5 text-red-600" />
                  <h4 className="text-sm font-bold text-gray-900">QR Code Absensi</h4>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Scan kode ini untuk absensi cepat dan akurat. 
                  Pastikan QR code terlihat jelas saat scanning.
                </p>
              </div>
              
              {/* QR Code */}
              <div className="flex-shrink-0 bg-white p-3 rounded-xl shadow-lg border-2 border-gray-200">
                <QRCodeSVG 
                  value={qrCodeData}
                  size={120}
                  level="H"
                  includeMargin={false}
                  className="rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Calendar className="w-3 h-3" />
              <span>Valid {currentYear}</span>
            </div>
            <div className="text-xs text-gray-400 font-mono">
              ID: {employee.employee_id}
            </div>
          </div>
        </div>

        {/* Bottom Accent */}
        <div className="h-2 bg-gradient-to-r from-red-600 via-red-700 to-red-800"></div>
      </div>

      {/* Download Button */}
      <button
        onClick={handleDownloadCard}
        className="mt-6 px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-bold hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2"
        data-testid="download-ecard-button"
      >
        <Download className="w-5 h-5" />
        Download E-Card
      </button>
    </div>
  );
};

export default ECard;
