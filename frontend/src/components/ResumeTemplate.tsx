import { forwardRef } from 'react'
import { Mail, Phone, MapPin, Globe, Award, BookOpen, Briefcase } from 'lucide-react'
import { formatDate } from '../utils/helpers'

interface ResumeTemplateProps {
  user: any;
  profile: any;
}

const ResumeTemplate = forwardRef<HTMLDivElement, ResumeTemplateProps>(({ user, profile }, ref) => {
  if (!user || !profile) return null;

  return (
    <div ref={ref} className="bg-white text-slate-900 p-12 max-w-[800px] mx-auto font-sans shadow-2xl" style={{ minHeight: '1122px' }}>
      {/* Header */}
      <header className="border-b-2 border-slate-200 pb-8 mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">{user.full_name}</h1>
          <p className="text-xl text-indigo-600 font-medium">{profile.current_title || 'Professional Candidate'}</p>
        </div>
        <div className="text-right text-sm text-slate-500 space-y-1">
          <div className="flex items-center justify-end gap-2"><Mail size={14} /> {user.email}</div>
          {user.phone && <div className="flex items-center justify-end gap-2"><Phone size={14} /> {user.phone}</div>}
          {user.location && <div className="flex items-center justify-end gap-2"><MapPin size={14} /> {user.location}</div>}
        </div>
      </header>

      {/* Summary */}
      {user.bio && (
        <section className="mb-8">
          <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
            Professional Summary
          </h2>
          <p className="text-slate-600 leading-relaxed text-sm">{user.bio}</p>
        </section>
      )}

      <div className="grid grid-cols-3 gap-12">
        {/* Left Column: Experience & Education */}
        <div className="col-span-2 space-y-8">
          {/* Experience */}
          <section>
            <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Briefcase size={18} className="text-indigo-600" /> Work Experience
            </h2>
            <div className="space-y-6">
              {profile.experience?.map((exp: any, i: number) => (
                <div key={i} className="relative pl-6 border-l-2 border-slate-100">
                  <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-2 border-indigo-600" />
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-slate-800">{exp.title}</h3>
                    <span className="text-xs font-bold text-slate-400 uppercase">{exp.start_date} — {exp.end_date || 'Present'}</span>
                  </div>
                  <p className="text-sm text-indigo-600 font-medium mb-2">{exp.company}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{exp.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Education */}
          <section>
            <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <BookOpen size={18} className="text-indigo-600" /> Education
            </h2>
            <div className="space-y-4">
              {profile.education?.map((edu: any, i: number) => (
                <div key={i}>
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-slate-800">{edu.degree}</h3>
                    <span className="text-xs font-bold text-slate-400">{edu.year}</span>
                  </div>
                  <p className="text-sm text-slate-600">{edu.institution}</p>
                  {edu.gpa && <p className="text-xs text-slate-400 mt-1">GPA: {edu.gpa}</p>}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Skills & Info */}
        <div className="space-y-8">
          {/* Skills */}
          <section>
            <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              Skills
            </h2>
            <div className="flex flex-wrap gap-2">
              {user.skills?.map((skill: any) => (
                <span key={skill.id} className="bg-slate-100 text-slate-700 px-3 py-1 rounded text-xs font-bold">
                  {skill.name}
                </span>
              ))}
            </div>
          </section>

          {/* Links */}
          <section>
            <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              Links
            </h2>
            <div className="space-y-2 text-sm">
              {user.linkedin_url && <a href={user.linkedin_url} className="flex items-center gap-2 text-indigo-600 hover:underline"><Globe size={14} /> LinkedIn</a>}
              {user.github_url && <a href={user.github_url} className="flex items-center gap-2 text-indigo-600 hover:underline"><Globe size={14} /> GitHub</a>}
              {user.website_url && <a href={user.website_url} className="flex items-center gap-2 text-indigo-600 hover:underline"><Globe size={14} /> Portfolio</a>}
            </div>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-20 pt-8 border-t border-slate-100 text-center">
        <p className="text-[10px] text-slate-400 uppercase tracking-widest">
          Generated by JobNova Job Portal AI
        </p>
      </footer>
    </div>
  )
})

ResumeTemplate.displayName = 'ResumeTemplate'

export default ResumeTemplate
