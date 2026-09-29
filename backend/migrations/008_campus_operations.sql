-- CampusArc AI - Migration 008: operational school-management layer
CREATE INDEX IF NOT EXISTS idx_homework_school_date ON homework(school_id,date);
CREATE INDEX IF NOT EXISTS idx_circulars_school_time ON circulars(school_id,timestamp);
CREATE INDEX IF NOT EXISTS idx_exams_student_date ON exams(student_id,schedule_date);
CREATE INDEX IF NOT EXISTS idx_fees_student_status ON fees(student_id,status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_status ON notifications(user_id,status);
