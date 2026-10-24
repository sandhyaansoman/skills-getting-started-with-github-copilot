document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities", { cache: "no-store" });
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        const participantsSection = document.createElement("div");
        participantsSection.className = "participants-section";

        const participantsHeading = document.createElement("h5");
        participantsHeading.textContent = `Participants (${details.participants.length})`;
        participantsSection.appendChild(participantsHeading);

        const participantsList = document.createElement("ul");
        details.participants.forEach((participant) => {
          const participantItem = document.createElement("li");
          participantItem.className = "participant-row";

          const participantName = document.createElement("span");
          participantName.textContent = participant;
          participantItem.appendChild(participantName);

          const removeButton = document.createElement("button");
          removeButton.className = "remove-participant-button";
          removeButton.type = "button";
          removeButton.title = `Unregister ${participant}`;
          removeButton.setAttribute("aria-label", `Unregister ${participant}`);

          const trashIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          trashIcon.setAttribute("viewBox", "0 0 24 24");
          trashIcon.setAttribute("aria-hidden", "true");
          trashIcon.innerHTML = '<path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6" />';
          removeButton.appendChild(trashIcon);

          removeButton.addEventListener("click", async () => {
            try {
              const response = await fetch(
                `/activities/${encodeURIComponent(name)}/participants/${encodeURIComponent(participant)}`,
                { method: "DELETE" }
              );

              if (!response.ok) {
                const result = await response.json();
                throw new Error(result.detail || "Unable to unregister participant");
              }

              await fetchActivities();
            } catch (error) {
              console.error("Error unregistering participant:", error);
              window.alert(error.message || "Failed to unregister participant. Please try again.");
            }
          });

          participantItem.appendChild(removeButton);
          participantsList.appendChild(participantItem);
        });

        if (details.participants.length === 0) {
          const emptyItem = document.createElement("li");
          emptyItem.className = "empty-participants";
          emptyItem.textContent = "No participants yet";
          participantsList.appendChild(emptyItem);
        }

        participantsSection.appendChild(participantsList);
        activityCard.appendChild(participantsSection);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
