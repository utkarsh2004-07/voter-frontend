import { useState } from 'react';
import React from 'react';
import { jsPDF } from 'jspdf';

const UserSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [bootNoFilter] = useState('264 Z. P. School,, Room No. 1, Khochivada');
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newMobile, setNewMobile] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setUserData(null);

    try {
      // Check if the search term is a card number
      const isCardNumber = /^[a-zA-Z0-9]+$/.test(searchTerm);

      // Prepare query params based on name or card number
      // Convert card number to uppercase if it's a card number search
      const queryParams = new URLSearchParams({
        bootNo: bootNoFilter,
        ...(isCardNumber
          ? { cardNo: searchTerm.toUpperCase() }
          : { name: searchTerm }),
      });

      const requestUrl = `https://webprrism.in/api/users/search?${queryParams.toString()}`;
      const response = await fetch(requestUrl);

      if (!response.ok) throw new Error('Failed to fetch data');

      const data = await response.json();

      // Filter the data to only include users from the specified boot number
      // For card number searches, make the comparison case-insensitive
      const usersInBoot = data.filter((user) => {
        const matchesBoot = user.Boot === bootNoFilter;
        if (isCardNumber) {
          return matchesBoot && user.CardNo.toUpperCase() === searchTerm.toUpperCase();
        }
        return matchesBoot;
      });

      if (usersInBoot.length === 0) {
        setError(`No users found in the boot "${bootNoFilter}" with the given search criteria.`);
      } else {
        setUserData(usersInBoot);
      }
    } catch (err) {
      setError('Error fetching user details. Please try again.');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMobileUpdate = async (userId) => {
    setUpdateLoading(true);
    setError(null);

    try {
      const response = await fetch(`https://webprrism.in/api/users/${userId}/add-mobile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ MobileNumber: newMobile }),
      });

      if (!response.ok) throw new Error('Failed to update mobile number');

      const updatedUser = await response.json();
      setUserData((prevData) =>
        prevData.map((user) => (user._id === userId ? updatedUser : user))
      );
      setNewMobile('');
    } catch (err) {
      setError('Error updating mobile number. Please try again.');
    } finally {
      setUpdateLoading(false);
    }
  };

  const downloadPDF = async (user) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a5' // Smaller than A4
    });
    const personalImageUrl = 'https://res.cloudinary.com/dlya5fr9x/image/upload/v1731044970/qdv3o65lyye7ozbjtoqg.png';

    try {
      const response = await fetch(personalImageUrl);
      const blob = await response.blob();
      const reader = new FileReader();

      reader.onloadend = () => {
        const base64Image = reader.result;

        // Add image to the PDF
        doc.addImage(base64Image, 'JPEG', -5, 0, 160, 50);

        doc.setFontSize(15);
        doc.text(`Full Name: ${user.FullName}`, 10, 70);
        doc.text(`Serial No: ${user.srno}`, 10, 80);
        doc.text(`Age: ${user.Age}`, 10, 90);
        doc.text(`Sex: ${user.Sex}`, 10, 100);
        doc.text(`Card No: ${user.CardNo}`, 10, 110);

        // Wrap Booth No text
        const wrapBooth = doc.splitTextToSize(`Booth No: ${user.Boot}`, 130); // Adjust width as needed
        doc.text(wrapBooth, 10, 120);

        // Add Mobile Number
        const mobileYPosition = 120 + (wrapBooth.length * 8); // Adjust Y position based on wrapped lines
        if (user.MobileNumber) {
          doc.text(`Mobile No: ${user.MobileNumber}`, 10, mobileYPosition);
        } else {
          doc.text(`Mobile No: Not provided`, 10, mobileYPosition);
        }

        doc.save(`${user.FullName}_Details.pdf`);
      };

      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('Error fetching or processing the image:', error);
    }
  };


  return (
    <div
      className="p-4 mb-2 max-w-md mx-auto"
      style={{
        backgroundImage: 'url(https://res.cloudinary.com/dlya5fr9x/image/upload/v1730271193/sxb89bgdetgz3nvtn5gq.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        minHeight: '100vh',
      }}
    >
      <div style={{ marginTop: '215px' }}>
        <input
          type="text"
          placeholder="Enter Full Name or Card Number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded mb-4"
        />
        <button
          onClick={handleSearch}
          disabled={loading || !searchTerm}
          className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>

        {error && <p className="text-black font-bold mt-4">{error}</p>}

        {userData && (
          <div className="mt-6">
            {/* <h3 className="text-lg font-semibold mb-4">User Details:</h3> */}
            {userData.length > 0 ? (
              userData.map((user) => (
                <div
                  id={`user-${user._id}`}
                  key={user._id}
                  className="border p-4 mb-4 rounded shadow bg-white opacity-90"
                >
                  <p className="font-medium">Full Name: {user.FullName}</p>
                  <p className=''>Serial No: {user.srno}</p>
                  <p className=''>Age: {user.Age}</p>
                  <p className=''>Sex: {user.Sex}</p>
                  <p className=''>Card No: {user.CardNo}</p>
                  <p className=''>Booth No: {user.Boot}</p>
                  {user.MobileNumber ? (
                    <p>Mobile No: {user.MobileNumber}</p>
                  ) : (
                    <p className="italic text-gray-600">No mobile number on file.</p>
                  )}

                  <div className="mt-4">
                    <input
                      type="text"
                      placeholder="Add or update mobile number"
                      value={newMobile}
                      onChange={(e) => setNewMobile(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded mb-2"
                    />
                    <button
                      onClick={() => handleMobileUpdate(user._id)}
                      disabled={updateLoading}
                      className="w-full p-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
                    >
                      {updateLoading ? 'Updating...' : 'Update Mobile Number'}
                    </button>
                    <button
                      onClick={() => downloadPDF(user)}
                      className="w-full p-2 mt-4 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
                    >
                      Download Slip as PDF
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-black font-bold mt-4">No users found in the boot "{bootNoFilter}" with the given search criteria.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserSearch;
