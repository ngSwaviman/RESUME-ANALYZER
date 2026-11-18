export const homeFor = (role) => {
  if (role === 'admin') return '/admin/dashboard';
  if (role === 'recruiter') return '/recruiter/dashboard';
  return '/candidate/dashboard';
};

export const roleLabel = (role) => {
  if (role === 'recruiter') return 'Recruiter';
  if (role === 'admin') return 'Administrator';
  return 'Candidate';
};
