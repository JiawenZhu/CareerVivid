/**
 * Data Connect Admin SDK - Bundled directly from src/dataconnect-admin-generated
 *
 * This file keeps the Data Connect SDK inside the functions codebase to avoid
 * local file:// dependency conflicts with `npm ci` on Google Cloud Build.
 *
 * When the Data Connect schema changes, regenerate this by copying from:
 *   src/dataconnect-admin-generated/index.cjs.js
 */

// validateAdminArgs exists at runtime but is not in the public TS types yet.
// Using require() to bypass the type check safely.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { validateAdminArgs } = require('firebase-admin/data-connect');

export const connectorConfig = {
  connector: 'example',
  serviceId: 'careervivid-social-db',
  location: 'us-central1'
};

export function syncUser(dcOrVarsOrOptions?: any, varsOrOptions?: any, options?: any) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('syncUser', inputVars, inputOpts);
}

export function syncUserBackend(dcOrVarsOrOptions?: any, varsOrOptions?: any, options?: any) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('syncUserBackend', inputVars, inputOpts);
}

export function createPost(dcOrVarsOrOptions?: any, varsOrOptions?: any, options?: any) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('createPost', inputVars, inputOpts);
}

export function updatePost(dcOrVarsOrOptions?: any, varsOrOptions?: any, options?: any) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('updatePost', inputVars, inputOpts);
}

export function deletePost(dcOrVarsOrOptions?: any, varsOrOptions?: any, options?: any) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('deletePost', inputVars, inputOpts);
}

export function followUser(dcOrVarsOrOptions?: any, varsOrOptions?: any, options?: any) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('followUser', inputVars, inputOpts);
}

export function unfollowUser(dcOrVarsOrOptions?: any, varsOrOptions?: any, options?: any) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('unfollowUser', inputVars, inputOpts);
}

export function likePost(dcOrVarsOrOptions?: any, varsOrOptions?: any, options?: any) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('likePost', inputVars, inputOpts);
}

export function unlikePost(dcOrVarsOrOptions?: any, varsOrOptions?: any, options?: any) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('unlikePost', inputVars, inputOpts);
}

export function addComment(dcOrVarsOrOptions?: any, varsOrOptions?: any, options?: any) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('addComment', inputVars, inputOpts);
}

export function deleteComment(dcOrVarsOrOptions?: any, varsOrOptions?: any, options?: any) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('deleteComment', inputVars, inputOpts);
}

export function getFollowingFeed(dcOrVarsOrOptions?: any, varsOrOptions?: any, options?: any) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, false);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('getFollowingFeed', inputVars, inputOpts);
}

export function getGlobalFeed(dcOrVarsOrOptions?: any, varsOrOptions?: any, options?: any) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, false);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('getGlobalFeed', inputVars, inputOpts);
}

export function getUserProfile(dcOrVarsOrOptions?: any, varsOrOptions?: any, options?: any) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('getUserProfile', inputVars, inputOpts);
}

export function getPostDetails(dcOrVarsOrOptions?: any, varsOrOptions?: any, options?: any) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('getPostDetails', inputVars, inputOpts);
}
