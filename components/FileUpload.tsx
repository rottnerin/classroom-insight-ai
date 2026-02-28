import React, { useRef, useState } from 'react';
import { UploadCloud, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect }) => {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndPass(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndPass(e.target.files[0]);
    }
  };

  const validateAndPass = (file: File) => {
    if (file.type.startsWith('video/')) {
      onFileSelect(file);
    } else {
      alert("Please upload a valid video file.");
    }
  };

  const onButtonClick = () => {
    inputRef.current?.click();
  };

  const uploadAreaStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    maxWidth: '48rem',
    margin: '0 auto',
  };


  return (
    <div style={uploadAreaStyle}>
      <div 
        style={{
          position: 'relative',
          width: '100%',
        }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
      >
        <input 
          ref={inputRef}
          type="file" 
          style={{ display: 'none' }}
          accept="video/*"
          onChange={handleChange}
        />
        
        {/* Large Input Field Style */}
        <div style={{
          position: 'relative',
          width: '100%',
          backgroundColor: '#ffffff',
          borderRadius: '1rem',
          padding: '1.5rem 1.75rem',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          border: dragActive ? '2px solid #3b82f6' : '2px solid transparent',
          transition: 'all 200ms ease-in-out',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
        }}
        onMouseEnter={(e) => {
          if (!dragActive) {
            e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)';
            e.currentTarget.style.boxShadow = '0 15px 35px rgba(0, 0, 0, 0.15)';
          }
        }}
        onMouseLeave={(e) => {
          if (!dragActive) {
            e.currentTarget.style.borderColor = 'transparent';
            e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.1)';
          }
        }}
        >
          <UploadCloud size={24} color={dragActive ? '#3b82f6' : '#94a3b8'} />
          <div style={{ flex: 1 }}>
            <div style={{ 
              fontSize: '1rem', 
              color: dragActive ? '#3b82f6' : '#94a3b8',
              fontWeight: 500
            }}>
              {dragActive ? 'Drop video file here' : 'Upload a classroom video or drag & drop'}
            </div>
            <div style={{ 
              fontSize: '0.75rem', 
              color: '#94a3b8',
              marginTop: '0.25rem'
            }}>
              Supports MP4, MOV, and other video formats
            </div>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem',
            color: '#ffffff',
            backgroundColor: '#3b82f6',
            padding: '0.625rem 1.25rem',
            borderRadius: '0.5rem',
            fontWeight: 500,
            whiteSpace: 'nowrap',
          }}>
            Browse
          </div>
        </div>

        {/* Note */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.75rem',
          color: 'rgba(255, 255, 255, 0.7)',
          marginTop: '1rem',
          justifyContent: 'center',
        }}>
          <AlertCircle size={14} />
          <span>For best results, use videos under 200MB</span>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
