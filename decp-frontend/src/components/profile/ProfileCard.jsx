import { Link } from "react-router-dom";
import {
  BriefcaseBusiness,
  CalendarDays,
  ExternalLink,
  GraduationCap,
  Mail,
  Pencil,
  UserRound,
} from "lucide-react";

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }

  return value;
};

const getProfileCompletion = (profile) => {
  const fields = [
    { label: "Name", value: profile?.name },
    { label: "University", value: profile?.university },
    { label: "Degree", value: profile?.degree },
    { label: "Graduation Year", value: profile?.graduationYear },
    { label: "Bio", value: profile?.bio },
    { label: "Skills", value: Array.isArray(profile?.skills) && profile.skills.filter(Boolean).length > 0 },
    { label: "LinkedIn or GitHub", value: profile?.linkedinUrl || profile?.githubUrl },
  ];
  const completed = fields.filter((field) => Boolean(field.value)).length;

  return {
    completed,
    missing: fields.filter((field) => !field.value).map((field) => field.label),
    percentage: Math.round((completed / fields.length) * 100),
    total: fields.length,
  };
};

const getInitial = (profile) => (profile?.name || profile?.email || "U").charAt(0).toUpperCase();

const ProfileLink = ({ href, label }) => {
  if (!href) {
    return (
      <span className="profile-link profile-link--empty">
        <ExternalLink size={16} aria-hidden="true" />
        {label}
      </span>
    );
  }

  return (
    <a className="profile-link" href={href} target="_blank" rel="noreferrer">
      <ExternalLink size={16} aria-hidden="true" />
      {label}
    </a>
  );
};

const ProfileCard = ({ profile }) => {
  const skills = Array.isArray(profile?.skills) ? profile.skills.filter(Boolean) : [];
  const completion = getProfileCompletion(profile);
  const missingItems = completion.missing.slice(0, 4);

  return (
    <div className="profile-overview">
      <section className="profile-hero" aria-labelledby="profile-identity-heading">
        <div className="profile-hero__identity">
          {profile?.profileImageUrl ? (
            <img
              className="profile-avatar"
              src={profile.profileImageUrl}
              alt={`${profile?.name ?? "User"} profile`}
            />
          ) : (
            <div className="profile-avatar profile-avatar--placeholder">{getInitial(profile)}</div>
          )}
          <div>
            <p className="profile-eyebrow">{formatValue(profile?.role)}</p>
            <h1 id="profile-identity-heading">{formatValue(profile?.name)}</h1>
            <p className="profile-hero__email">
              <Mail size={16} aria-hidden="true" />
              {formatValue(profile?.email)}
            </p>
          </div>
        </div>

        <Link className="profile-button profile-button--primary" to="/profile/edit">
          <Pencil size={17} aria-hidden="true" />
          Edit Profile
        </Link>
      </section>

      <div className="profile-layout">
        <aside className="profile-sidebar" aria-labelledby="profile-readiness-heading">
          <section className="profile-panel">
            <div className="profile-panel__header">
              <div>
                <p className="profile-eyebrow">Readiness</p>
                <h2 id="profile-readiness-heading">Profile Completion</h2>
              </div>
              <strong>{completion.percentage}%</strong>
            </div>

            <progress max="100" value={completion.percentage}>
              {completion.percentage}%
            </progress>

            {missingItems.length > 0 ? (
              <div className="profile-next-list">
                <p>Missing details</p>
                <ul>
                  {missingItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="profile-complete">Core profile details are complete.</p>
            )}
          </section>

          <section className="profile-panel" aria-labelledby="profile-links-heading">
            <div className="profile-panel__header">
              <div>
                <p className="profile-eyebrow">Presence</p>
                <h2 id="profile-links-heading">Career Links</h2>
              </div>
            </div>
            <div className="profile-link-list">
              <ProfileLink href={profile?.linkedinUrl} label="LinkedIn" />
              <ProfileLink href={profile?.githubUrl} label="GitHub" />
            </div>
          </section>
        </aside>

        <div className="profile-main">
          <section className="profile-panel" aria-labelledby="profile-about-heading">
            <div className="profile-panel__header">
              <div>
                <p className="profile-eyebrow">About</p>
                <h2 id="profile-about-heading">Bio</h2>
              </div>
            </div>
            <p className={profile?.bio ? "profile-bio" : "profile-empty-text"}>{formatValue(profile?.bio)}</p>
          </section>

          <section className="profile-panel" aria-labelledby="profile-academic-heading">
            <div className="profile-panel__header">
              <div>
                <p className="profile-eyebrow">Academic</p>
                <h2 id="profile-academic-heading">Education Details</h2>
              </div>
            </div>

            <dl className="profile-detail-grid">
              <div>
                <dt>
                  <GraduationCap size={16} aria-hidden="true" />
                  University
                </dt>
                <dd>{formatValue(profile?.university)}</dd>
              </div>
              <div>
                <dt>
                  <BriefcaseBusiness size={16} aria-hidden="true" />
                  Degree
                </dt>
                <dd>{formatValue(profile?.degree)}</dd>
              </div>
              <div>
                <dt>
                  <CalendarDays size={16} aria-hidden="true" />
                  Graduation Year
                </dt>
                <dd>{formatValue(profile?.graduationYear)}</dd>
              </div>
              <div>
                <dt>
                  <UserRound size={16} aria-hidden="true" />
                  Role
                </dt>
                <dd>{formatValue(profile?.role)}</dd>
              </div>
            </dl>
          </section>

          <section className="profile-panel" aria-labelledby="profile-skills-heading">
            <div className="profile-panel__header">
              <div>
                <p className="profile-eyebrow">Career</p>
                <h2 id="profile-skills-heading">Skills</h2>
              </div>
            </div>

            {skills.length > 0 ? (
              <ul className="profile-skills">
                {skills.map((skill) => (
                  <li key={skill}>{skill}</li>
                ))}
              </ul>
            ) : (
              <p className="profile-empty-text">Not provided</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
