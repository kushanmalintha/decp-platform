import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { getCurrentUserProfile, updateCurrentUserProfile } from "../../api/userApi";
import ProfileForm from "../../components/profile/ProfileForm";
import "./Profile.css";

const getErrorMessage = (error, fallback) => error.response?.data?.message ?? error.message ?? fallback;

const EditProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      setLoading(true);
      setError("");

      try {
        const profileData = await getCurrentUserProfile();

        if (isMounted) {
          setProfile(profileData);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(getErrorMessage(loadError, "Unable to load your profile for editing."));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (profileData) => {
    setError("");
    setSuccessMessage("");

    try {
      const updatedProfile = await updateCurrentUserProfile(profileData);
      if (updatedProfile) {
        setProfile(updatedProfile);
      }
      setSuccessMessage("Profile updated. Returning to your profile...");

      window.setTimeout(() => {
        navigate("/profile", { replace: true });
      }, 900);
    } catch (updateError) {
      setError(getErrorMessage(updateError, "Unable to update your profile."));
    }
  };

  if (loading) {
    return (
      <section className="profile-page">
        <div className="profile-state">Loading profile...</div>
      </section>
    );
  }

  return (
    <section className="profile-page">
      <div className="profile-page__header">
        <div>
          <h1>Edit Profile</h1>
          <p>Keep your education, skills, and portfolio links up to date.</p>
        </div>
        <Link className="profile-button profile-button--secondary" to="/profile">
          Back to Profile
        </Link>
      </div>

      {error && <div className="form-error">{error}</div>}
      {successMessage && <div className="profile-success">{successMessage}</div>}

      {!profile && !error ? (
        <div className="profile-state">No profile data was returned.</div>
      ) : profile ? (
        <ProfileForm initialProfile={profile} onSubmit={handleSubmit} />
      ) : null}
    </section>
  );
};

export default EditProfile;
