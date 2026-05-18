import { useEffect, useState } from "react";

import { getCurrentUserProfile } from "../../api/userApi";
import ProfileCard from "../../components/profile/ProfileCard";
import "./Profile.css";

const getErrorMessage = (error, fallback) => error.response?.data?.message ?? error.message ?? fallback;

const MyProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
          setError(getErrorMessage(loadError, "Unable to load your profile."));
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

  if (loading) {
    return (
      <section className="profile-page">
        <div className="profile-state">Loading profile...</div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="profile-page">
        <div className="form-error">{error}</div>
      </section>
    );
  }

  return (
    <section className="profile-page">
      <ProfileCard profile={profile} />
    </section>
  );
};

export default MyProfile;
