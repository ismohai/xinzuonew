# Git 版本管理说明

## 仓库地址
https://github.com/ismohai/xinzuonew

## 每次修改代码后上传（推送）

在项目根目录下打开终端，依次运行以下三条命令：

```powershell
git add -A
git commit -m "描述你这次改了什么"
git push
```

**说明：**
- `git add -A` — 把所有改动加入暂存区
- `git commit -m "..."` — 提交改动，引号里写本次修改的简要说明
- `git push` — 推送到 GitHub

## 查看修改了哪些文件

```powershell
git status
```

## 查看历史版本

```powershell
git log --oneline
```

## 回退到某个版本

```powershell
# 先查看历史，找到想回退的版本号（前面那串字符，如 abc1234）
git log --oneline

# 回退（会丢弃之后的所有修改）
git reset --hard abc1234
git push --force
```

> ⚠️ `reset --hard` 会丢弃回退点之后的所有改动，请谨慎使用。

## 快捷方式

如果嫌每次输入三条命令麻烦，可以一次性运行：

```powershell
git add -A; git commit -m "更新"; git push
```
