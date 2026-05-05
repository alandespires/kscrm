
ALTER TABLE public.school_classes
  ADD CONSTRAINT school_classes_course_fk FOREIGN KEY (course_id) REFERENCES public.school_courses(id) ON DELETE CASCADE,
  ADD CONSTRAINT school_classes_teacher_fk FOREIGN KEY (teacher_id) REFERENCES public.school_teachers(id) ON DELETE SET NULL;

ALTER TABLE public.school_enrollments
  ADD CONSTRAINT school_enrollments_class_fk FOREIGN KEY (class_id) REFERENCES public.school_classes(id) ON DELETE CASCADE,
  ADD CONSTRAINT school_enrollments_student_fk FOREIGN KEY (student_id) REFERENCES public.school_students(id) ON DELETE CASCADE;

ALTER TABLE public.school_lessons
  ADD CONSTRAINT school_lessons_class_fk FOREIGN KEY (class_id) REFERENCES public.school_classes(id) ON DELETE CASCADE,
  ADD CONSTRAINT school_lessons_teacher_fk FOREIGN KEY (teacher_id) REFERENCES public.school_teachers(id) ON DELETE SET NULL;

ALTER TABLE public.school_attendance
  ADD CONSTRAINT school_attendance_lesson_fk FOREIGN KEY (lesson_id) REFERENCES public.school_lessons(id) ON DELETE CASCADE,
  ADD CONSTRAINT school_attendance_student_fk FOREIGN KEY (student_id) REFERENCES public.school_students(id) ON DELETE CASCADE;

ALTER TABLE public.school_assessments
  ADD CONSTRAINT school_assessments_class_fk FOREIGN KEY (class_id) REFERENCES public.school_classes(id) ON DELETE CASCADE;

ALTER TABLE public.school_grades
  ADD CONSTRAINT school_grades_assessment_fk FOREIGN KEY (assessment_id) REFERENCES public.school_assessments(id) ON DELETE CASCADE,
  ADD CONSTRAINT school_grades_student_fk FOREIGN KEY (student_id) REFERENCES public.school_students(id) ON DELETE CASCADE;

ALTER TABLE public.school_announcements
  ADD CONSTRAINT school_announcements_class_fk FOREIGN KEY (class_id) REFERENCES public.school_classes(id) ON DELETE CASCADE,
  ADD CONSTRAINT school_announcements_student_fk FOREIGN KEY (student_id) REFERENCES public.school_students(id) ON DELETE CASCADE;
