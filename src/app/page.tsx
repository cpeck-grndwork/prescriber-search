'use client';

import { useState, useEffect } from 'react';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import outputs from '../../amplify_outputs.json';

Amplify.configure(outputs);
const client = generateClient<Schema>();

export default function Home() {
  const [npiSearch, setNpiSearch] = useState('');
  const [drugSearch, setDrugSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [prescriberResults, setPrescriberResults] = useState<any[]>([]);
  const [drugResults, setDrugResults] = useState<any[]>([]);
  const [prescriberMatches, setPrescriberMatches] = useState<any[]>([]);
  const [selectedNpi, setSelectedNpi] = useState<string | null>(null);
  const [selectedPrescriberName, setSelectedPrescriberName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [prescriberSearched, setPrescriberSearched] = useState(false);
  const [drugSearched, setDrugSearched] = useState(false);

  const searchByPrescriber = async () => {
    if (!npiSearch.trim()) {
      alert('Please enter an NPI or prescriber name');
      return;
    }
    console.log('searchByPrescriber called with:', npiSearch);
    setLoading(true);
    setPrescriberResults([]);
    setPrescriberMatches([]);
    setSelectedNpi(null);
    setDrugResults([]);
    setPrescriberSearched(true);
    setDrugSearched(false);
    try {
      let data;
      // Check if input is numeric (NPI) or text (name)
      if (/^\d+$/.test(npiSearch)) {
        // Search by NPI using index
        const result = await client.models.Prescription.listPrescriptionByNpi({
          npi: npiSearch,
          limit: 10000000
        });
        data = result.data;
        setPrescriberResults(data.filter(item => item !== null));
      } else {
        // Search by name in Prescriber table
        const searchLower = npiSearch.toLowerCase().trim();
        const result = await client.models.Prescriber.list({
          limit: 10000000
        });
        
        // Filter results client-side for better matching
        const filtered = result.data.filter(item => {
          if (!item || !item.prescriberNameLower) return false;
          return item.prescriberNameLower.includes(searchLower);
        });
        
        setPrescriberMatches(filtered);
      }
      console.log('Prescriber results:', data);
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  const selectPrescriber = async (npi: string, name: string) => {
    setLoading(true);
    setSelectedNpi(npi);
    setSelectedPrescriberName(name);
    try {
      const { data } = await client.models.Prescription.list({
        filter: { genericNameLower: { contains: drugSearch.toLowerCase() } },
        limit: 10000000
      });
      const filtered = data.filter(item => item !== null);
      const sorted = filtered.sort((a, b) => (b.totalClaims || 0) - (a.totalClaims || 0));
      setPrescriberResults(sorted);
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  const searchByDrug = async () => {
    if (!drugSearch.trim()) {
      alert('Please enter a drug name');
      return;
    }
    if (stateFilter && !/^[A-Z]{2}$/i.test(stateFilter.trim())) {
      alert('State must be a 2-letter abbreviation (e.g., CA, NY)');
      return;
    }
    setLoading(true);
    setPrescriberResults([]);
    setPrescriberMatches([]);
    setDrugSearched(true);
    setPrescriberSearched(false);
    try {
      // Search Drug table for partial matches
      const drugResult = await client.models.Drug.list({
        filter: { genericNameLower: { contains: drugSearch.toLowerCase() } },
        limit: 2500
      });
      
      const matchingDrugs = drugResult.data.filter(item => item !== null);
      console.log(`Found ${matchingDrugs.length} matching drugs`);
      
      // Get prescriptions for all matching drugs
      let allResults: any[] = [];
      for (const drug of matchingDrugs) {
        const { data } = await client.models.Prescription.listPrescriptionByGenericNameLowerAndTotalClaims({
          genericNameLower: drug.genericNameLower,
        sortDirection: 'DESC',
        limit: 10000000
      });
        allResults = allResults.concat(data.filter(item => item !== null));
      }
      
      // Filter by state if specified
      if (stateFilter) {
        allResults = allResults.filter(item => item.state === stateFilter.toUpperCase());
      }
      
      // Sort by total claims
      allResults.sort((a, b) => (b.totalClaims || 0) - (a.totalClaims || 0));
      
      console.log(`${allResults.length} total results after filtering`);
      setDrugResults(allResults.slice(0, 100));
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  return (
    <div className="container">
      <h1>What do they prescribe?</h1>

      {drugResults.length === 0 && (
        <div className="search-section">
          <h2>Search by Prescriber NPI or Name</h2>
          <div className="search-form">
            <input
              type="text"
              placeholder="Enter NPI or Name (e.g., 1003000126 or Smith)"
              value={npiSearch}
              onChange={(e) => setNpiSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchByPrescriber()}
            />
            <button onClick={searchByPrescriber} disabled={loading}>
              Search
            </button>
          </div>
          {prescriberMatches.length > 0 && (
            <div className="results">
              <h3>Select Prescriber ({prescriberMatches.length} matches)</h3>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>NPI</th>
                    <th>Location</th>
                    <th>Type</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {prescriberMatches.map((prescriber) => (
                    <tr key={prescriber.npi}>
                      <td>{prescriber.prescriberName}</td>
                      <td>{prescriber.npi}</td>
                      <td>{prescriber.city}, {prescriber.state}</td>
                      <td>{prescriber.prescriberType}</td>
                      <td>
                        <button onClick={() => selectPrescriber(prescriber.npi, prescriber.prescriberName)}>
                          View Meds
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {prescriberSearched && !loading && prescriberMatches.length === 0 && prescriberResults.length === 0 && (
            <div className="error">
              No results found. Either this prescriber is not in the 2023 Medicare database, or the name/NPI is incorrect.
            </div>
          )}
          {prescriberResults.length > 0 && (
            <div className="results">
              <h3>Medications Prescribed by {selectedPrescriberName} ({prescriberResults.length})</h3>
              <table>
                <thead>
                  <tr>
                    <th>Brand Name</th>
                    <th>Generic Name</th>
                    <th>Total Claims</th>
                    <th>Beneficiaries</th>
                    <th>Total Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {prescriberResults.filter(rx => rx !== null).map((rx) => (
                    <tr key={rx.id}>
                      <td>{rx.brandName}</td>
                      <td>{rx.genericName}</td>
                      <td>{rx.totalClaims?.toLocaleString()}</td>
                      <td>{rx.totalBeneficiaries?.toLocaleString()}</td>
                      <td>${rx.totalDrugCost?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="search-section">
        <h2>Search Top Prescribers by Drug</h2>
        <div className="search-form">
          <input
            type="text"
            placeholder="Enter drug name (generic name must be used)"
            value={drugSearch}
            onChange={(e) => setDrugSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchByDrug()}
          />
          <input
            type="text"
            placeholder="State (2 letters)"
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchByDrug()}
            style={{ flex: '0 0 150px' }}
          />
          <button onClick={searchByDrug} disabled={loading}>
            Search
          </button>
        </div>
        {drugSearched && !loading && drugResults.length === 0 && (
          <div className="error">
            No results found. The drug may not be in the 2023 medicare database or the spelling may be incorrect.
          </div>
        )}
        {drugResults.length > 0 && (
          <div className="results">
            <h3>Top Prescribers ({drugResults.length})</h3>
            <table>
              <thead>
                <tr>
                  <th>Prescriber</th>
                  <th>NPI</th>
                  <th>Location</th>
                  <th>Type</th>
                  <th>Total Claims</th>
                </tr>
              </thead>
              <tbody>
                {drugResults.filter(rx => rx !== null).map((rx) => (
                  <tr key={rx.id}>
                    <td>{rx.prescriberName}</td>
                    <td>{rx.npi}</td>
                    <td>{rx.city}, {rx.state}</td>
                    <td>{rx.prescriberType}</td>
                    <td>{rx.totalClaims?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {loading && <div className="loading">Loading...</div>}
    </div>
  );
}
