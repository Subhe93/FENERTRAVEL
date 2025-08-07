import ShipmentsTable from '@/components/ShipmentsTable';
import ShipmentsStats from '@/components/ShipmentsStats';

const HomePage = () => {

  return (
    <div className="space-y-6">
      <ShipmentsStats />
      <ShipmentsTable />
    </div>
  );
};

export default HomePage;