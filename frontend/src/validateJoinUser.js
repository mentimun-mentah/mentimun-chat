import isLength from 'validator/lib/isLength'

const validateJoinUser = (state, setState) => {
  const username = { ...state.username };
  let isGood = true;

  if(!isLength(username.value, {min: 1, max: 100})){
    username.isValid = false;
    username.message = "Username must be between 1 and 100 characters";
    isGood = false;
  }

  if (!isGood) setState({ ...state, username });
  return isGood;
}

export default validateJoinUser
