import { useEffect } from "react";
import { useForm } from "react-hook-form";

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

const ProfileForm = ({ initialProfile, onSubmit, submitLabel = "Save Profile" }) => {
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
      <label>
        Name
        <input type="text" autoComplete="name" {...register("name")} />
      </label>

      <label>
        Bio
        <textarea rows="5" {...register("bio")} />
      </label>

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
          min="2000"
          max="2100"
          {...register("graduationYear", {
            validate: (value) => {
              if (value === "" || value === null || value === undefined) {
                return true;
              }

              const year = Number(value);

              if (!Number.isInteger(year)) {
                return "Graduation year must be a whole year.";
              }

              return (year >= 2000 && year <= 2100) || "Use a year from 2000 to 2100.";
            },
          })}
        />
        {errors.graduationYear && (
          <span className="field-error">{errors.graduationYear.message}</span>
        )}
      </label>

      <label>
        Skills
        <input
          type="text"
          placeholder="React, Java, Spring Boot"
          {...register("skills")}
        />
      </label>

      <div className="profile-form__grid">
        <label>
          LinkedIn URL
          <input type="url" autoComplete="url" {...register("linkedinUrl")} />
        </label>

        <label>
          GitHub URL
          <input type="url" autoComplete="url" {...register("githubUrl")} />
        </label>
      </div>

      <label>
        Profile Image URL
        <input type="url" {...register("profileImageUrl")} />
      </label>

      <div className="profile-form__actions">
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
};

export default ProfileForm;
