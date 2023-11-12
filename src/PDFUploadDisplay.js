import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Document, Page, pdfjs } from 'react-pdf';
import { useAuth } from './AuthContext';
import AuthForms from './AuthForms';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

function PDFUploadDisplay() {
  const { user, login, logout } = useAuth();
  const [pdfFile, setPdfFile] = useState(null);
  const [selectedPages, setSelectedPages] = useState([]);
  const [numPages, setNumPages] = useState(null);
  const [newPdf, setNewPdf] = useState(null);
  const [optionMenu, setOptionMenu] = useState(false);

  const toggleOptions = () => {
    setOptionMenu(!optionMenu);
  }

  const onDrop = async (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file.type === 'application/pdf') {
        setPdfFile(file);
        setSelectedPages([]);
        try {
          const formData = new FormData();
          formData.append('pdfFile', file);
          const token = user?.token;
          const headers = {
            Authorization: `Bearer ${token}`
          };
          console.log('Form Data', formData);
          const response = await fetch('http://localhost:4000/upload', {
            method: 'POST',
            body: formData,
            headers,
          });
          if (response.ok) {
            const data = await response.json();
            
          } else {
            throw new Error('Error uploading PDF file');
          }
        } catch (error) {
          alert('Error uploading PDF file');
        }
      } else {
        alert('Only PDF files are allowed.');
      }
    }
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  const handleDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const togglePageSelection = (page) => {
    if (selectedPages.includes(page)) {
      setSelectedPages(selectedPages.filter((p) => p !== page));
    } else {
      setSelectedPages([...selectedPages, page]);
    }
  };

  const createNewPDF = async () => {
    if (!pdfFile || selectedPages.length === 0) return;
    const sortedSelectedPages = selectedPages.sort((a, b) => a - b);
    const formData = new FormData();
    formData.append('file', pdfFile);
    console.log(selectedPages)
    formData.append('selectedPages', sortedSelectedPages);
    const encodedSelectedPages = encodeURIComponent(JSON.stringify(sortedSelectedPages));
    const url = `http://localhost:4000/createNewPdf?selectedPages=${encodedSelectedPages}`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });
      if (response.ok) {
        const uint8ArrayData = new Uint8Array(await response.arrayBuffer());
        const blob = new Blob([uint8ArrayData], { type: 'application/pdf' });
        setNewPdf(blob);
      } else {
        throw new Error('Error creating a new PDF');
      }
    } catch (error) {
      alert('Error creating a new PDF');
    }
  };

  const handleLogout = () => {
    logout();
  }
  const handleDownload = () => {
    try {
      const url = URL.createObjectURL(newPdf);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'downloaded-pdf.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error creating download link:', error.message);
    }
  };
  return (
    <div>
      {user ? (
        <div>
          <div className="option-menu">
            <button onClick={toggleOptions} className='options'>Options</button>
            {optionMenu && (
              <div className="menu-dropdown">
                <p className="user-name">Welcome, {user.username}</p>
                <button onClick={handleLogout}>Logout</button>
              </div>
            )}
          </div>
          <div {...getRootProps()} className="dropzone">
            <input {...getInputProps()} />
            <p>Drag and drop a PDF file here, or click to select one</p>
          </div>

          {pdfFile && (
            <>
              <div>
                <h2 className='pages_selection'>Select Pages to Extract:</h2>
                {Array.from(new Array(numPages), (el, index) => (
                  <label key={index} className='page-selection'>
                    Page {index + 1}
                    <input
                      type="checkbox"
                      value={index + 1}
                      checked={selectedPages.includes(index + 1)}
                      onChange={() => togglePageSelection(index + 1)}
                    />
                  </label>
                ))}
              </div>

              <button onClick={createNewPDF} className='new_pdf'>Create New PDF</button>

              {newPdf && (
                <button
                  className='download_pdf'
                  onClick={handleDownload}
                >
                  Download file
                </button>
              )}

              <Document
                file={pdfFile}
                onLoadSuccess={handleDocumentLoadSuccess}
              >
                {Array.from(new Array(numPages), (el, index) => (
                  <div key={`page_${index + 1}`} className="pdf-page">
                    <p className="page-number">Page {index + 1}</p>
                    <Page
                      pageNumber={index + 1}
                    />
                  </div>
                ))}
              </Document>
            </>
          )}
          <p className='user_name'>Welcome, {user.username}</p>
          <button onClick={handleLogout} className='logout_btn'>Logout</button>
        </div>
      ) : (
        <AuthForms onLogin={(username) => handleLogin(username)} />
      )}
    </div>
  );
}

export default PDFUploadDisplay;