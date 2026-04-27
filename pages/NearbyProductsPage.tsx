import React from 'react';
import NearbyProductsSection from '../components/NearbyProductsSection';

const NearbyProductsPage: React.FC = () => {
  return (
    <div className="space-y-8 pb-24">
      <NearbyProductsSection mode="page" />
    </div>
  );
};

export default NearbyProductsPage;
