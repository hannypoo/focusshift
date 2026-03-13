import { useNavigate } from 'react-router-dom';
import WeeklyScheduleEditor from '../components/WeeklyScheduleEditor';

export default function WeeklyScheduleView() {
  const navigate = useNavigate();
  return <WeeklyScheduleEditor onBack={() => navigate(-1)} />;
}
