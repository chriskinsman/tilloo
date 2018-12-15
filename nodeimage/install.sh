#!/usr/bin/env bash

cd /tilloo/nodeimage

locale-gen en_US en_US.UTF-8 && \
dpkg-reconfigure locales

echo "================= Updating package lists ==================="
apt-get update

echo "================= Adding some global settings ==================="
mv gbl_env.sh /etc/profile.d/
mkdir -p $HOME/.ssh/
mv config $HOME/.ssh/
mv 90forceyes /etc/apt/apt.conf.d/

echo "================= Installing basic packages ==================="
apt-get install -y \
  sudo  \
  build-essential \
  curl \
  gcc \
  make \
  openssl \
  software-properties-common \
  wget \
  nano \
  unzip \
  libxslt-dev \
  libxml2-dev \
  python-dev \
  git

echo "================= Installing NVM ==================="
curl https://raw.githubusercontent.com/creationix/nvm/v0.29.0/install.sh | bash

# Set NVM_DIR so the installations go to the right place
export NVM_DIR="/root/.nvm"

# add source of nvm to .bashrc - allows user to use nvm as a command
echo "source ~/.nvm/nvm.sh" >> $HOME/.bashrc


echo "================= Installing latest nodejs 10.13.0 ==================="
. /root/.nvm/nvm.sh && nvm install 10.13.0 && nvm use 10.13.0 && nvm alias default 10.13.0


echo "================= Cleaning package lists ==================="
apt-get clean
apt-get autoclean
apt-get autoremove

echo "================= Removing /tilloo/nodeimage ==============="
rm -rf /tilloo/nodeimage
