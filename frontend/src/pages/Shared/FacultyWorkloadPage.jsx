import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import FacultyWorkload from './FacultyWorkload';
import '../../styles/Shared/FacultyWorkload.css';

const FacultyWorkloadPage = () => {
  const { data: facultyData = [], isLoading } = useQuery({
    queryKey: ['faculty-workload'],
    queryFn: async () => {
      const response = await axios.get('/api/faculty');
      return response.data.data;
    }
  });

  // Transform backend data to match FacultyWorkload component expectations
  const transformedFaculty = facultyData.map(f => {
    const schedules = f.schedules || [];
    const totalUnits = schedules.reduce((sum, s) => {
      const lecUnits = parseFloat(s.course?.lec_units || 0);
      const labUnits = parseFloat(s.course?.lab_units || 0);
      return sum + lecUnits + labUnits;
    }, 0);

    const subjects = schedules.map(s => ({
      code: s.course?.code || 'N/A',
      name: s.course?.title || 'Untitled',
      section: s.section?.name || 'N/A',
      schedule: `${s.day || 'TBA'} ${s.time_start || ''}-${s.time_end || ''}`.trim()
    }));

    const totalStudents = schedules.reduce((sum, s) => {
      return sum + (s.section?.students_count || 0);
    }, 0);

    return {
      id: f.id,
      name: `${f.first_name} ${f.last_name}`,
      department: f.department?.name || 'N/A',
      position: f.position || 'Faculty',
      units: totalUnits,
      subjects: subjects,
      totalStudents: totalStudents,
      color: getRandomColor(f.id)
    };
  });

  if (isLoading) {
    return (
      <div className="page">
        <div className="page-header">
          <h2 className="page-title">Faculty Workload & Schedules</h2>
        </div>
        <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
      </div>
    );
  }

  return <FacultyWorkload faculty={transformedFaculty} />;
};

// Helper to generate consistent colors based on ID
const getRandomColor = (id) => {
  const colors = [
    '#FF6B1A', '#3B82F6', '#10B981', '#8B5CF6', 
    '#F59E0B', '#EF4444', '#06B6D4', '#EC4899'
  ];
  return colors[id % colors.length];
};

export default FacultyWorkloadPage;
