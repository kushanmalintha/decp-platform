import { Link } from "react-router-dom";

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }

  return value;
};

const ProfileCard = ({ profile }) => {
  const skills = Array.isArray(profile?.skills) ? profile.skills.filter(Boolean) : [];

  return (
    <article className="profile-card">
      <div className="profile-card__header">
        <div className="profile-card__identity">
          {profile?.profileImageUrl ? (
            <img
              className="profile-card__avatar"
              src={profile.profileImageUrl}
              alt={`${profile?.name ?? "User"} profile`}
            />
          ) : (
            <div className="profile-card__avatar profile-card__avatar--placeholder">
              {(profile?.name || profile?.email || "U").charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1>{formatValue(profile?.name)}</h1>
            <p>{formatValue(profile?.email)}</p>
          </div>
        </div>

        <Link className="profile-button profile-button--primary" to="/profile/edit">
          Edit Profile
        </Link>
      </div>

      <dl className="profile-card__details">
        <div>
          <dt>Role</dt>
          <dd>{formatValue(profile?.role)}</dd>
        </div>
        <div>
          <dt>University</dt>
          <dd>{formatValue(profile?.university)}</dd>
        </div>
        <div>
          <dt>Degree</dt>
          <dd>{formatValue(profile?.degree)}</dd>
        </div>
        <div>
          <dt>Graduation Year</dt>
          <dd>{formatValue(profile?.graduationYear)}</dd>
        </div>
        <div>
          <dt>LinkedIn</dt>
          <dd>
            {profile?.linkedinUrl ? (
              <a href={profile.linkedinUrl} target="_blank" rel="noreferrer">
                {profile.linkedinUrl}
              </a>
            ) : (
              "Not provided"
            )}
          </dd>
        </div>
        <div>
          <dt>GitHub</dt>
          <dd>
            {profile?.githubUrl ? (
              <a href={profile.githubUrl} target="_blank" rel="noreferrer">
                {profile.githubUrl}
              </a>
            ) : (
              "Not provided"
            )}
          </dd>
        </div>
        <div>
          <dt>Profile Image URL</dt>
          <dd>{formatValue(profile?.profileImageUrl)}</dd>
        </div>
      </dl>

      <section className="profile-card__section" aria-labelledby="profile-bio-heading">
        <h2 id="profile-bio-heading">Bio</h2>
        <p>{formatValue(profile?.bio)}</p>
      </section>

      <section className="profile-card__section" aria-labelledby="profile-skills-heading">
        <h2 id="profile-skills-heading">Skills</h2>
        {skills.length > 0 ? (
          <ul className="profile-skills">
            {skills.map((skill) => (
              <li key={skill}>{skill}</li>
            ))}
          </ul>
        ) : (
          <p>Not provided</p>
        )}
      </section>
    </article>
  );
};

export default ProfileCard;
