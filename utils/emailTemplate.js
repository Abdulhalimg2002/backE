const htmlTemplate = (link) => {
  return `
    <h2>Reset Password</h2>
    <p>Click here:</p>
    <a href="${link}">Reset Password</a>
  `;
};

module.exports = htmlTemplate;