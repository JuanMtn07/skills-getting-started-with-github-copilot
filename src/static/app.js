document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Helper: escape HTML to avoid injection when inserting names/emails
  function escapeHTML(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // Helper: compute initials from a name or email
  function getInitials(raw) {
    if (!raw) return "";
    const part = String(raw).split("@")[0];
    const tokens = part.split(/[\.\-_ ]+/).filter(Boolean);
    if (tokens.length === 0) return part.slice(0, 2).toUpperCase();
    if (tokens.length === 1) return tokens[0].slice(0, 2).toUpperCase();
    return (tokens[0][0] + tokens[1][0]).toUpperCase();
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      // Avoid returning a cached response so the client always sees the latest
      // participants immediately after a signup.
      const response = await fetch("/activities", { cache: "no-store" });
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Reset activity select (avoid duplicate options on refresh)
      activitySelect.innerHTML = '<option value="">Select an activity</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants section
        let participantsHTML = `<div class="participants">`;
        if (Array.isArray(details.participants) && details.participants.length > 0) {
          participantsHTML += `<ul>`;
          details.participants.forEach((p) => {
            const initials = getInitials(p);
            participantsHTML += `<li><span class="participant-badge">${escapeHTML(initials)}</span><span class="participant-name">${escapeHTML(p)}</span></li>`;
          });
          participantsHTML += `</ul>`;
        } else {
          participantsHTML += `<div class="empty">No participants yet</div>`;
        }
        participantsHTML += `</div>`;

        activityCard.innerHTML = `
          <h4>${escapeHTML(name)}</h4>
          <p>${escapeHTML(details.description)}</p>
          <p><strong>Schedule:</strong> ${escapeHTML(details.schedule)}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHTML}
        `;

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

        // Update the DOM locally so the new participant appears immediately.
        // This avoids a full re-fetch for snappier UI. We still re-fetch to
        // fully synchronize in case of any server-side transformations.
        updateActivityDOM(activity, email);

        // Refresh activities to show updated participants from the server and
        // ensure consistency. Await so the UI update completes before the
        // user continues interacting.
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

  // Update activity card in the DOM with a newly signed-up participant.
  function updateActivityDOM(activityName, email) {
    // Find the activity card by matching the H4 text
    const cards = Array.from(document.querySelectorAll('.activity-card'));
    const card = cards.find(c => c.querySelector('h4') && c.querySelector('h4').textContent.trim() === activityName);
    if (!card) return;

    const participantsContainer = card.querySelector('.participants');
    if (!participantsContainer) return;

    const list = participantsContainer.querySelector('ul');
    const emptyDiv = participantsContainer.querySelector('.empty');

    // Create list if it didn't exist
    let ul = list;
    if (!ul) {
      ul = document.createElement('ul');
      if (emptyDiv) emptyDiv.remove();
      participantsContainer.appendChild(ul);
    }

    // Append new participant
    const li = document.createElement('li');
    const badge = document.createElement('span');
    badge.className = 'participant-badge';
    badge.textContent = getInitials(email);
    const nameSpan = document.createElement('span');
    nameSpan.className = 'participant-name';
    nameSpan.textContent = email;
    li.appendChild(badge);
    li.appendChild(nameSpan);
    ul.appendChild(li);

    // Update availability text if present
    const availability = card.querySelector('p strong') ? Array.from(card.querySelectorAll('p')).find(p => p.textContent.includes('Availability:')) : null;
    if (availability) {
      // Extract current spots left and decrement if possible
      const text = availability.textContent || availability.innerText;
      const match = text.match(/(\d+) spots left/);
      if (match) {
        const spots = Math.max(0, parseInt(match[1], 10) - 1);
        // Replace the text node content after the strong element
        availability.parentElement.innerHTML = `<strong>Availability:</strong> ${spots} spots left`;
      }
    }
  }

  // Initialize app
  fetchActivities();
});
