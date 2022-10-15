# Git rebase automations

`git rebase -i $BASE_COMMIT` is extremely useful for squashing and reordering commits (and more).

I will assume basic knowledge of `git rebase -i` (`-i` = `--interactive`).

Also, `git rebase --autosquash` (config: `rebase.autosquash`) 
in combination with [`git commit --fixup`][commit fixup] is useful to know, but independent of the following sections.

I will demonstrate two usages:
1. [exec](#exec)
2. [sequence-editor](#sequence-editor)

## exec

`git rebase --exec COMMAND`

> Append "exec <cmd>" after each line creating a commit [...]
> Any command that fails will interrupt the rebase, with exit code 1.

A common example is `git rebase -i --exec "make test"` which will open your EDITOR with a plan like:

```
pick 5928aea a commit
exec make test
pick 04d0fda another commit
exec make test

# Commands:
# p, pick <commit> = use commit
# r, reword <commit> = use commit, but edit the commit message
# e, edit <commit> = use commit, but stop for amending
# s, squash <commit> = use commit, but meld into previous commit
# f, fixup <commit> = like "squash", but discard this commit's log message
# x, exec <command> = run command (the rest of the line) using shell
# b, break = stop here (continue rebase later with 'git rebase --continue')
# d, drop <commit> = remove commit
# l, label <label> = label current HEAD with a name
```

In many cases, this is good enough for finding bugs etc. It's a more straight-forward `git bisect`.

But a lot more than tests can be accomplished, for example changing author of several commits:

```shell
git rebase -i --exec 'git commit --amend --reset-author --no-edit' fd8e16b
```

## sequence-editor

Git, being a good Unix tool, respects your `$SHELL` and `$EDITOR` environment variables.

It even checks a separate variable for editing the rebase instruction file (shown above): `GIT_SEQUENCE_EDITOR`.

Those familiar with Unix may see where this is going; an `$EDITOR` does not need to be visual or interactive, it can be a command.

This enables some powerful shell automation.

For example, to rename FOO to BAR in a sequence of commit messages:

```shell
GIT_SEQUENCE_EDITOR='sed -i "s/^pick /r /"' EDITOR='sed -i s/FOO/BAR/' git rebase -i master
```

[commit fixup]: https://git-scm.com/docs/git-commit#Documentation/git-commit.txt---fixupamendrewordltcommitgt

