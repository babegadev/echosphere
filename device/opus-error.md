# For Apple Silicon (M1/M2/M3)
export DYLD_LIBRARY_PATH=/opt/homebrew/lib:$DYLD_LIBRARY_PATH

# For Intel Macs
export DYLD_LIBRARY_PATH=/usr/local/lib:$DYLD_LIBRARY_PATH

# Add to your shell profile to make permanent
echo 'export DYLD_LIBRARY_PATH=/opt/homebrew/lib:$DYLD_LIBRARY_PATH' >> ~/.zshrc
source ~/.zshrc

# Now reinstall Python packages
pip uninstall opuslib pyogg -y
pip install opuslib pyogg