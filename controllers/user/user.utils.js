exports.filterObj = (bodyObj, ...allowedFields) => {
  const newBodyObj = {};
  Object.keys(bodyObj).forEach((key) => {
    if (allowedFields.includes(key)) newBodyObj[key] === bodyObj[key];
  });

  return newBodyObj;
};
