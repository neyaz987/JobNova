import { useState, useEffect } from 'react'
import { 
  User, Mail, Phone, MapPin, Briefcase, 
  Linkedin, Github, Globe, Save, Upload,
  Plus, X, Award, FileText
} from 'lucide-react'
import Layout from '../components/layout/Layout'
import { Button, Input, Textarea } from '../components/common/UI'
import { usersApi, skillsApi } from '../api/services'
import { useAuthStore } from '../store/authStore'
import type { Skill, CandidateProfile } from '../utils/types'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [candidateProfile, setCandidateProfile] = useState<CandidateProfile | null>(null)
  const [recruiterProfile, setRecruiterProfile] = useState<RecruiterProfile | null>(null)
  const [allSkills, setAllSkills] = useState<Skill[]>([])
  const [skillSearch, setSkillSearch] = useState('')
  
  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    location: '',
    bio: '',
    linkedin_url: '',
    github_url: '',
    website_url: '',
  })

  const [candidateData, setCandidateData] = useState({
    current_title: '',
    current_company: '',
    experience_years: 0,
    expected_salary: 0,
    is_open_to_work: true,
  })

  const [recruiterData, setRecruiterData] = useState({
    company_name: '',
    company_website: '',
    industry: '',
    company_size: '',
    company_description: '',
  })

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        phone: user.phone || '',
        location: user.location || '',
        bio: user.bio || '',
        linkedin_url: user.linkedin_url || '',
        github_url: user.github_url || '',
        website_url: user.website_url || '',
      })
    }
    
    const profilePromise = user?.role === 'recruiter' 
      ? usersApi.getRecruiterProfile() 
      : usersApi.getCandidateProfile()

    Promise.all([
      profilePromise,
      skillsApi.list()
    ]).then(([profRes, skillsRes]) => {
      if (user?.role === 'recruiter') {
        const data = profRes.data as RecruiterProfile
        setRecruiterProfile(data)
        setRecruiterData({
          company_name: data.company_name || '',
          company_website: data.company_website || '',
          industry: data.industry || '',
          company_size: data.company_size || '',
          company_description: data.company_description || '',
        })
      } else {
        const data = profRes.data as CandidateProfile
        setCandidateProfile(data)
        setCandidateData({
          current_title: data.current_title || '',
          current_company: data.current_company || '',
          experience_years: data.experience_years || 0,
          expected_salary: data.expected_salary || 0,
          is_open_to_work: data.is_open_to_work ?? true,
        })
      }
      setAllSkills(skillsRes.data)
    }).catch(err => {
      console.error('Failed to fetch profile', err)
    }).finally(() => setLoading(false))
  }, [user])

  const handleSave = async () => {
    setSaving(true)
    try {
      // Update User
      const userRes = await usersApi.updateProfile(formData)
      updateUser(userRes.data)
      
      // Update Specific Profile
      if (user?.role === 'recruiter') {
        await usersApi.updateRecruiterProfile(recruiterData)
      } else {
        await usersApi.updateCandidateProfile(candidateData)
      }
      
      toast.success('Profile updated successfully!')
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const toggleSkill = async (skill: Skill) => {
    const isSelected = user?.skills?.some(s => s.id === skill.id)
    let newSkills = []
    if (isSelected) {
      newSkills = user?.skills?.filter(s => s.id !== skill.id).map(s => s.id) || []
    } else {
      newSkills = [...(user?.skills?.map(s => s.id) || []), skill.id]
    }
    
    try {
      const res = await usersApi.updateProfile({ skill_ids: newSkills })
      updateUser(res.data)
    } catch {
      toast.error('Failed to update skills')
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="py-12 max-w-4xl mx-auto px-4 space-y-8">
          <div className="h-12 glass shimmer w-1/3 rounded-xl" />
          <div className="h-64 glass shimmer rounded-3xl" />
          <div className="h-96 glass shimmer rounded-3xl" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="py-12 max-w-5xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl mb-2">Profile <span className="gradient-text">Settings</span></h1>
            <p className="text-white/40">Keep your professional identity up to date.</p>
          </div>
          <Button onClick={handleSave} loading={saving} className="shadow-glow-indigo">
            <Save size={18} className="mr-2" /> Save Changes
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Personal Info */}
          <div className="lg:col-span-2 space-y-8">
            <section className="glass-dark p-8 rounded-3xl space-y-6">
              <h3 className="text-xl flex items-center gap-2 border-b border-white/5 pb-4">
                <User className="text-indigo-400" size={20} /> Basic Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-white/40">Full Name</label>
                  <Input 
                    value={formData.full_name} 
                    onChange={e => setFormData({...formData, full_name: e.target.value})}
                    placeholder="John Doe"
                    icon={<User size={16} />}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-white/40">Phone Number</label>
                  <Input 
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    placeholder="+1 (555) 000-0000"
                    icon={<Phone size={16} />}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-white/40">Location</label>
                <Input 
                  value={formData.location} 
                  onChange={e => setFormData({...formData, location: e.target.value})}
                  placeholder="San Francisco, CA (or Remote)"
                  icon={<MapPin size={16} />}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-white/40">Bio / Summary</label>
                <Textarea 
                  value={formData.bio} 
                  onChange={e => setFormData({...formData, bio: e.target.value})}
                  placeholder="Tell us about yourself and your career goals..."
                  rows={4}
                />
              </div>
            </section>

            {user?.role === 'candidate' ? (
              <>
                <section className="glass-dark p-8 rounded-3xl space-y-6">
                  <h3 className="text-xl flex items-center gap-2 border-b border-white/5 pb-4">
                    <Briefcase className="text-indigo-400" size={20} /> Professional Details
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-white/40">Current Title</label>
                      <Input 
                        value={candidateData.current_title} 
                        onChange={e => setCandidateData({...candidateData, current_title: e.target.value})}
                        placeholder="Senior Software Engineer"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-white/40">Current Company</label>
                      <Input 
                        value={candidateData.current_company} 
                        onChange={e => setCandidateData({...candidateData, current_company: e.target.value})}
                        placeholder="Google / Freelance"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-white/40">Years of Experience</label>
                      <Input 
                        type="number"
                        value={candidateData.experience_years} 
                        onChange={e => setCandidateData({...candidateData, experience_years: Number(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-white/40">Expected Salary (USD/yr)</label>
                      <Input 
                        type="number"
                        value={candidateData.expected_salary} 
                        onChange={e => setCandidateData({...candidateData, expected_salary: Number(e.target.value)})}
                      />
                    </div>
                  </div>
                </section>

                <section className="glass-dark p-8 rounded-3xl space-y-6">
                  <h3 className="text-xl flex items-center gap-2 border-b border-white/5 pb-4">
                    <Award className="text-indigo-400" size={20} /> Skills & Expertise
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {user?.skills?.map(skill => (
                        <span key={skill.id} className="flex items-center gap-2 bg-indigo-500/20 text-indigo-400 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider">
                          {skill.name}
                          <button onClick={() => toggleSkill(skill)} className="hover:text-white"><X size={14} /></button>
                        </span>
                      ))}
                    </div>
                    
                    <div className="relative">
                      <Input 
                        placeholder="Search skills to add..." 
                        value={skillSearch}
                        onChange={e => setSkillSearch(e.target.value)}
                      />
                      {skillSearch && (
                        <div className="absolute top-full left-0 right-0 mt-2 glass-dark z-10 p-2 max-h-48 overflow-y-auto custom-scrollbar border border-white/10 shadow-2xl">
                          {allSkills.filter(s => s.name.toLowerCase().includes(skillSearch.toLowerCase()) && !user?.skills?.some(us => us.id === s.id)).map(s => (
                            <button
                              key={s.id}
                              onClick={() => { toggleSkill(s); setSkillSearch('') }}
                              className="w-full text-left px-4 py-2 hover:bg-white/5 rounded-lg text-sm flex justify-between items-center group"
                            >
                              {s.name}
                              <Plus size={14} className="opacity-0 group-hover:opacity-100" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                <section className="glass-dark p-8 rounded-3xl space-y-6">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <h3 className="text-xl flex items-center gap-2">
                      <Globe className="text-indigo-400" size={20} /> Portfolio Projects
                    </h3>
                    <Button variant="secondary" outline size="sm" onClick={() => {
                      const newProfile = {...candidateProfile!}
                      newProfile.portfolio_projects = [...(newProfile.portfolio_projects || []), {title: '', description: '', link: ''}]
                      setCandidateProfile(newProfile)
                    }}>
                      <Plus size={14} className="mr-1" /> Add Project
                    </Button>
                  </div>

                  <div className="space-y-6">
                    {candidateProfile?.portfolio_projects?.map((project, idx) => (
                      <div key={idx} className="p-6 glass bg-white/5 rounded-2xl relative group">
                        <button 
                          onClick={() => {
                            const newProfile = {...candidateProfile!}
                            newProfile.portfolio_projects = newProfile.portfolio_projects.filter((_, i) => i !== idx)
                            setCandidateProfile(newProfile)
                          }}
                          className="absolute top-4 right-4 text-white/20 hover:text-red-400 transition-colors"
                        >
                          <X size={18} />
                        </button>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-white/20">Project Title</label>
                            <Input 
                              value={project.title}
                              onChange={e => {
                                const newProfile = {...candidateProfile!}
                                newProfile.portfolio_projects[idx].title = e.target.value
                                setCandidateProfile(newProfile)
                              }}
                              placeholder="e.g. E-commerce Platform"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-white/20">Project Link</label>
                            <Input 
                              value={project.link}
                              onChange={e => {
                                const newProfile = {...candidateProfile!}
                                newProfile.portfolio_projects[idx].link = e.target.value
                                setCandidateProfile(newProfile)
                              }}
                              placeholder="https://github.com/..."
                            />
                          </div>
                        </div>
                        <div className="mt-4 space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-white/20">Description</label>
                          <Textarea 
                            value={project.description}
                            onChange={e => {
                              const newProfile = {...candidateProfile!}
                              newProfile.portfolio_projects[idx].description = e.target.value
                              setCandidateProfile(newProfile)
                            }}
                            placeholder="Briefly describe what you built..."
                            rows={2}
                          />
                        </div>
                      </div>
                    ))}
                    
                    {(!candidateProfile?.portfolio_projects || candidateProfile.portfolio_projects.length === 0) && (
                      <div className="text-center py-10 border-2 border-dashed border-white/5 rounded-3xl">
                        <p className="text-white/20 text-sm italic">No projects added yet.</p>
                      </div>
                    )}
                  </div>
                </section>
              </>
            ) : (
              <section className="glass-dark p-8 rounded-3xl space-y-6">
                <h3 className="text-xl flex items-center gap-2 border-b border-white/5 pb-4">
                  <Briefcase className="text-indigo-400" size={20} /> Company Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-white/40">Company Name</label>
                    <Input 
                      value={recruiterData.company_name} 
                      onChange={e => setRecruiterData({...recruiterData, company_name: e.target.value})}
                      placeholder="Acme Inc."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-white/40">Company Website</label>
                    <Input 
                      value={recruiterData.company_website} 
                      onChange={e => setRecruiterData({...recruiterData, company_website: e.target.value})}
                      placeholder="https://acme.inc"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-white/40">Industry</label>
                    <Input 
                      value={recruiterData.industry} 
                      onChange={e => setRecruiterData({...recruiterData, industry: e.target.value})}
                      placeholder="Software / Fintech"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-white/40">Company Size</label>
                    <Input 
                      value={recruiterData.company_size} 
                      onChange={e => setRecruiterData({...recruiterData, company_size: e.target.value})}
                      placeholder="11-50 employees"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-white/40">Company Description</label>
                  <Textarea 
                    value={recruiterData.company_description} 
                    onChange={e => setRecruiterData({...recruiterData, company_description: e.target.value})}
                    placeholder="Tell candidates about your company culture and mission..."
                    rows={4}
                  />
                </div>
              </section>
            )}
          </div>

          {/* Right Column: Profile Visual & Socials */}
          <div className="space-y-8">
            <section className="glass-neumorph p-8 text-center">
              <div className="relative w-32 h-32 mx-auto mb-6 group">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-4xl font-bold shadow-2xl border-4 border-white/10 overflow-hidden">
                  {user?.avatar_url 
                    ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                    : user?.full_name?.[0]}
                </div>
                <button className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                  <Upload size={24} />
                </button>
              </div>
              <h4 className="text-xl font-bold">{user?.full_name}</h4>
              <p className="text-xs text-white/30 uppercase tracking-widest font-bold mt-1">{user?.role}</p>
            </section>

            <section className="glass-dark p-8 rounded-3xl space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 border-b border-white/5 pb-4 flex items-center gap-2">
                <Globe size={16} /> Online Presence
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/20">LinkedIn Profile</label>
                  <Input 
                    value={formData.linkedin_url} 
                    onChange={e => setFormData({...formData, linkedin_url: e.target.value})}
                    placeholder="https://linkedin.com/in/..."
                    icon={<Linkedin size={14} />}
                  />
                </div>
                {user?.role === 'candidate' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/20">GitHub Username</label>
                    <Input 
                      value={formData.github_url} 
                      onChange={e => setFormData({...formData, github_url: e.target.value})}
                      placeholder="https://github.com/..."
                      icon={<Github size={14} />}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/20">{user?.role === 'recruiter' ? 'Company Website' : 'Personal Website'}</label>
                  <Input 
                    value={formData.website_url} 
                    onChange={e => setFormData({...formData, website_url: e.target.value})}
                    placeholder="https://yourportfolio.com"
                    icon={<Globe size={14} />}
                  />
                </div>
              </div>
            </section>

            {user?.role === 'candidate' && (
              <section className="glass-dark p-8 rounded-3xl space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 border-b border-white/5 pb-4 flex items-center gap-2">
                  <FileText size={16} /> Resume Status
                </h3>
                {candidateProfile?.resume_url ? (
                  <div className="flex items-center justify-between p-3 glass bg-indigo-500/5 border-indigo-500/20">
                    <span className="text-xs font-medium truncate max-w-[150px]">{candidateProfile.resume_filename || 'My_Resume.pdf'}</span>
                    <Award size={14} className="text-emerald-400" />
                  </div>
                ) : (
                  <p className="text-xs text-white/30 italic">No resume uploaded.</p>
                )}
                <Button variant="outline" className="w-full text-xs" onClick={() => window.location.href = '/candidate/dashboard'}>
                  Manage Resume
                </Button>
              </section>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
