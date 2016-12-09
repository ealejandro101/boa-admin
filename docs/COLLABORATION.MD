# Git Workflow

This document aims to document how collaborators (main development staff) should work when using git, github and the development workflow. This workflow works based on a centralized repository where developers should create pull request to include any new feature or fix to the main branches or release branches as described below.

## Branching Model

We should differentiate the different repositories as follow:

* **origin**: The official and centralized repository for Boa. This is boaproject/boa repository on github.

* **local**: Developer local repository, where he/she cloned the centralized repository.

As **developers** we should always push completed topic branches to origin. Then create pull requests to origin/master and wait for a **collaborator** to approve.

## Primary Branches

The centralized repository (**origin**) will hold the following primary branches:

* **master**: Development towards the next release.
* **release-x.y.z**: Maintenance branches for existing releases.

These branches exists in parallel, are permanent and are defined as follows:

**master** is the branch where the source code of **HEAD** always reflects the latest version. Each released stable version will be a tagged commit in a **relase-x.y.z** branch.

## Topic Branches

Topic branches are for developers to develop new features, bug fixes, etc. so that they can be easily merged to **master**. The must follow a few simple rules listed below.

* May branch off from: **master** or **release-x.y.z** branch.
* When completed, they must create pull request to **master** or **release-x.y.z** or both, depending when they are new features (only to **master**) or bug fixes (to both source branch and **master**)
* Branching naming convention must follow the format: [ft|bg|tk|dc]\_[short_description]\_[#issue_number]. e.g. dc\_collaboration\_specs\_document\_#1. 

Topic branches are used to develop new features and fix reported issues. When starting development of a feature, the target release in which this feature will be incorporated may well be unknown. The essence of a topic branch is that it exists as long as the feature is in development, but will eventually be merged back into master or a release-* branch (to add the new feature or bugfix to a next release) or discarded (if not approved or dissapointed experiment).

Commits to topic branches must be done regularly and the commit message must be clear and specific about what changes / enhancements were done for the release.

## Release Branches

* May branch off from: **master**
* Must merge back into: -
* Branch naming convention: release-x.y.z

Release branches are created when **master** has reached the state of the next major or minor release. They allow for continuous bug fixes and patch releases of that particular release until the release is no longer supported.

The key moment to branch off a new release branch from master is when master reflects the desired state of the new release.

## Creating a release branch

Release branches are created from **master** branch. When the state of **master** is ready for the upcoming target version we branch off and give the release branch a name reflecting the target version number. In addition the ".0" release must be tagged on the new release branch. Naming convention is release-x.y.z, where x.y.z is the target version number.

```bash
git checkout -b release-1.0.0 origin/master
git push origin release-1.0.0
git tag -a 1.1.0.0
git push origin release-1.0.0
```

Release branches must exists as long as they are supported.

# Issues management

Github issues will be used for issue management. Before creating an issue please ensure you search the issue database to ensure the issue has not been created before. If you found the issue, please just add to the conversation by adding a comment.

## Creating issues

When creating an issue please add a title that short describe what is the issue about

Use the description to add as much information as posible about the issue. 

* If reporting a bug, please provide information about version, browser information and steps to reproduce the issue. If possible add screenshots or a short screencast
* If requesting a new feature, ensure you enter proper description, in some cases mockups or some images will help to illustrate the desired behavior 

Ensure the issue is labeled appropiately, labels available and how to use them are available below.

## Issue Labeling

Github issues use labels to help classified and filter issues. Please use the labels described below to tag new or existing issues as required.

* **bug** Indicates the issue is a bug or malfunction of the system
* **discussion** Issues marked with this label will be reviewed during next development team meeting 
* **doc** Indicates the issue is related to documentation
* **duplicate** Indicates the issue is duplicate of another issue. When labeling an issue as duplicate please add a comment with the reference to the duplicated issue.
* **enhancement** Indicates the issue is for an improvement of an existing feature
* **feature** Indicates the issue is for a new feature to be added to the system
* **feedback** Indicates the issue requires some feedback from an specific person (if so, please add a reference @person) or from any other member of the team
* **help wanted** Indicates the assignee requires some help to continue with the development.
* **in progress** Indicates the assignee has started development of the issue.
* **invalid** Indicates the issue doesn't conform with the project scope
* **metadata** Indicates the issue is related to learning object metadata.
* **question** This is not tecnically an issue but a question that may or may not lead to an issue.
* **task** Indicates something that must be accomplished in benefit of the project, e.g. Create a branch release, move the documentation out to a new folder. etc.
* **ux** Indicates the issue is related to the user interface or affects the user experience
* **wontfix** Indicates the issue won't be fixed. A proper comment must be added explaining the reason.



Commiting
	Add issue number on latest commit message.
	Limit commit issues to only 128 characters. (Moodle use 
	
	
123456789012345678901234567890123456789012345678901234567890123456789012

