import React, { useEffect, useState, useRef } from 'react';
import { getPriceAdvisory } from '../api';

function PriceAdvisoryWidget({ category, base_block, target_block, campus_id, token }) {
  const [advisory, setAdvisory] = useState(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!category || !base_block || !target_block || !campus_id) {
      setAdvisory(null);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      setLoading(true);
      getPriceAdvisory(token, {
        category: category,
        base_block: base_block,
        target_block: target_block,
        campus_id: campus_id
      })
        .then((data) => {
          setAdvisory(data);
          setLoading(false);
        })
        .catch(() => {
          setAdvisory(null);
          setLoading(false);
        });
    }, 600);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [category, base_block, target_block, campus_id, token]);

  if (!category || !base_block || !target_block) {
    return null;
  }

  return (
    <div style={{
      background: '#F9F9F9',
      border: '1px solid #E5E7EB',
      borderRadius: '8px',
      padding: '10px 14px',
      fontSize: '13px',
      color: '#6B7280',
      marginTop: '6px'
    }}>
      {loading && <span>Analysing market rates...</span>}
      {!loading && advisory === null && <span>No pricing data yet for this route.</span>}
      {!loading && advisory !== null && advisory.suggested_price === null && (
        <span>{advisory.message}</span>
      )}
      {!loading && advisory !== null && advisory.suggested_price !== null && (
        <span>
          {advisory.message.split('₹')[0]}
          <span style={{ color: '#10B981', fontWeight: 700 }}>
            ₹{Math.round(advisory.suggested_price)}
          </span>
          {advisory.message.split('₹' + Math.round(advisory.suggested_price))[1] || '. Adjusting your offer optimises matching.'}
        </span>
      )}
    </div>
  );
}

export default PriceAdvisoryWidget;
