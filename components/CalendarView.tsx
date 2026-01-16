
import React from 'react';

import { ViewState } from '../types';

interface CalendarViewProps {
  userId: string;
  onNavigate: (newView: ViewState) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ userId, onNavigate }) => {
    return (
        <div>CalendarView reparando JSX...<br />userId: {userId}</div>
    );
}

export default CalendarView;
