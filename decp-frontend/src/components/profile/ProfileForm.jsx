import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { Save, X } from "lucide-react";

const MIN_GRADUATION_YEAR = 1900;
const MAX_GRADUATION_YEAR = new Date().getFullYear() + 10;

const profileToFormValues = (profile) => ({
  name: profile?.name ?? "",
  bio: profile?.bio ?? "",
  university: profile?.university ?? "",
  degree: profile?.degree ?? "",
  graduationYear: profile?.graduationYear ?? "",
  skills: Array.isArray(profile?.skills) ? profile.skills.join(", ") : profile?.skills ?? "",
  linkedinUrl: profile?.linkedinUrl ?? "",
  githubUrl: profile?.githubUrl ?? "",
  profileImageUrl: profile?.profileImageUrl ?? "",
});

const splitSkills = (skillsText) =>
  skillsText
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);

const optionalTrimmedValue = (value) => {
  const trimmed = value.trim();
  return trimmed || null;
};

const ProfileForm = ({ cancelHref = "/profile", initialProfile, onSubmit, submitLabel = "Save Profile" }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: profileToFormValues(initialProfile),
  });

  useEffect(() => {
    reset(profileToFormValues(initialProfile));
  }, [initialProfile, reset]);

  const handleFormSubmit = (values) => {
    const graduationYearValue = values.graduationYear?.toString().trim();

    return onSubmit({
      name: optionalTrimmedValue(values.name),
      bio: optionalTrimmedValue(values.bio),
      university: optionalTrimmedValue(values.university),
      degree: optionalTrimmedValue(values.degree),
      graduationYear: graduationYearValue ? Number(graduationYearValue) : null,
      skills: splitSkills(values.skills ?? ""),
      linkedinUrl: optionalTrimmedValue(values.linkedinUrl),
      githubUrl: optionalTrimmedValue(values.githubUrl),
      profileImageUrl: optionalTrimmedValue(values.profileImageUrl),
    });
  };

  return (
    <form className="profile-form" onSubmit={handleSubmit(handleFormSubmit)}>
      <section className="profile-form__section" aria-labelledby="profile-form-identity-heading">
        <div className="profile-form__section-header">
          <p className="profile-eyebrow">Identity</p>
          <h2 id="profile-form-identity-heading">Personal Details</h2>
        </div>

        <div className="profile-form__grid">
          <label>
            Name
            <input type="text" autoComplete="name" {...register("name")} />
          </label>

          <label>
            Profile Image URL
            <input type="url" placeholder="https://example.com/profile.jpg" {...register("profileImageUrl")} />
          </label>
        </div>

        <label>
          Bio
          <textarea rows="5" {...register("bio")} />
        </label>
      </section>

      <section className="profile-form__section" aria-labelledby="profile-form-academic-heading">
        <div className="profile-form__section-header">
          <p className="profile-eyebrow">Academic</p>
          <h2 id="profile-form-academic-heading">Education</h2>
        </div>

        <div className="profile-form__grid">
          <label>
            University
            <input type="text" {...register("university")} />
          </label>

          <label>
            Degree
            <input type="text" {...register("degree")} />
          </label>
        </div>

        <label>
          Graduation Year
          <input
            type="number"
            min={MIN_GRADUATION_YEAR}
            max={MAX_GRADUATION_YEAR}
            {...register("graduationYear", {
              validate: (value) => {
                if (value === "" || value === null || value === undefined) {
                  return true;
                }

                const year = Number(value);

                if (!Number.isInteger(year)) {
                  return "Graduation year must be a whole year.";
                }

                return (
                  (year >= MIN_GRADUATION_YEAR && year <= MAX_GRADUATION_YEAR) ||
                  `Use a year from ${MIN_GRADUATION_YEAR} to ${MAX_GRADUATION_YEAR}.`
                );
              },
            })}
          />
          {errors.graduationYear && <span className="field-error">{errors.graduationYear.message}</span>}
        </label>
      </section>

      <section className="profile-form__section" aria-labelledby="profile-form-career-heading">
        <div className="profile-form__section-header">
          <p className="profile-eyebrow">Career</p>
          <h2 id="profile-form-career-heading">Skills & Links</h2>
        </div>

        <label>
          Skills
          <input type="text" placeholder="React, Java, Spring Boot" {...register("skills")} />
        </label>

        <div className="profile-form__grid">
          <label>
            LinkedIn URL
            <input type="url" autoComplete="url" placeholder="https://linkedin.com/in/name" {...register("linkedinUrl")} />
          </label>

          <label>
            GitHub URL
            <input type="url" autoComplete="url" placeholder="https://github.com/username" {...register("githubUrl")} />
          </label>
        </div>
      </section>

      <div className="profile-form__actions">
        <Link className="profile-button profile-button--secondary" to={cancelHref}>
          <X size={17} aria-hidden="true" />
          Cancel
        </Link>
        <button className="profile-button profile-button--primary" type="submit" disabled={isSubmitting}>
          <Save size={17} aria-hidden="true" />
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
};

export default ProfileForm;
