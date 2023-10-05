# Use the official Ubuntu base image
FROM ubuntu:22.04

EXPOSE 3456

# COPY . /app/crud
# Update the package repository and install curl
RUN apt-get update && apt-get install -y curl

# Install Node.js and npm
RUN curl -sL https://deb.nodesource.com/setup_18.x | bash -
RUN apt-get install -y nodejs
# RUN npm install -g npm@latest

# Install GIT Repo
# RUN apt-get update && apt-get install -y git
# RUN echo $PATH
# RUN which git

# Install wget to use to login shopify if redirected url become unreachable
# RUN apt-get install wget

# Install ruby
# RUN apt-get install ruby-full -y
# RUN gem install bundler
# RUN apt-get install build-essential -y


# Check Node.js and npm versions
# RUN node -v
# RUN npm -v

# Check GIT version
# RUN git --version

# Set the working directory
# WORKDIR /app

# By default, start a shell (you can override this in the docker run command)
# CMD ["/bin/bash"]