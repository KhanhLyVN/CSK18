    document.getElementById(
      "fileName"
    ).textContent = "";
    if (fFile) {
      fFile.value = "";
    }
    chkCourse.checked = false;
    courseBoxWrap.classList.remove(
      "show"
    );
    chips().forEach((chip) => {
      chip.classList.remove(
        "active"
      );
    });
    document
      .querySelectorAll(
        'input[name="ticketMainType"]'
      )
      .forEach((input) => {
        input.checked = false;
      });
    issueSelect.innerHTML = '<option value="">-- Chọn chi tiết vấn đề --</option>';
    issueField.classList.remove("show");
    issueSelect.disabled = true;
    issueSelect.value = "";
    fDateEl.value =
      isoToday();
    ticketNum =
      "HV-000000";
    updateStub();
    if (layoutContainer) {
      layoutContainer.classList.remove(
        "has-submitted"
      );
    }
    document
      .getElementById("successView")
      .classList.remove("show");
    document
      .getElementById("formView")
      .classList.remove("hide");