// src/screens/classes/mathClass/datastatisticsprobability.js
import React from 'react';
import ClassTopicScreen from '../../../components/ClassTopicScreen';

const topics = [
    {
      key: 'collection',
      title: 'Data Collection & Representation',
      grade: '3-5',
      color: '#9C27B0', // Bright purple
      description:
        'Gathering data through surveys or experiments and displaying it in tables, bar graphs, line plots, histograms, or box plots.',
      learn: [
        { heading: 'Collecting Good Data', body: 'A survey asks the same clear question to a group of people, and an experiment measures something under controlled conditions, like counting how many seeds sprout with different amounts of water. Asking the same question the same way to everyone keeps the data fair to compare.' },
        { heading: 'Choosing the Right Graph', body: 'A bar graph compares amounts across separate categories (like favorite fruits). A line plot shows how often each value occurs along a number line, good for small sets of numbers. A histogram groups numeric data into ranges to show a distribution, and a box plot summarizes a data set\'s spread using its median and quartiles.' },
      ],
      practice: [
        { question: 'You want to compare how many students like pizza, tacos, and salad. Which graph is the best choice?', options: ['Bar graph', 'Line plot', 'Box plot', 'None of these'], answerIndex: 0, explanation: 'A bar graph is ideal for comparing amounts across separate categories.' },
        { question: 'Which of these is an example of an experiment rather than a survey?', options: ['Asking classmates their favorite color', 'Measuring plant height with different amounts of sunlight', 'Asking neighbors how many pets they have', 'Asking friends their birth month'], answerIndex: 1, explanation: 'An experiment involves controlling a condition (sunlight) and measuring a result (plant height), not just asking a question.' },
      ],
      apply: {
        prompt: 'Ask at least 10 people one clear survey question (like "What\'s your favorite season?"). Record the results in a tally table, then create a bar graph to display the data.',
        checklist: ['Asked the same question to at least 10 people', 'Recorded answers in a tally table', 'Created a bar graph from the data', 'Wrote one sentence describing what the graph shows'],
      },
      help: {
        readings: [],
        videos: [
          {
            title:
              'Science of Data Visualization | Bar, scatter plot, line, histograms, pie, box plots, bubble chart',
            url: 'https://youtu.be/csXmVBw8cdo?feature=shared',
          },
        ],
      },
    },
    {
      key: 'descriptive',
      title: 'Descriptive Statistics',
      grade: '6-8',
      color: '#E91E63', // Bright pink
      description:
        'Summarizing data sets using measures of central tendency (mean, median, mode) and spread (range, interquartile range, standard deviation).',
      learn: [
        { heading: 'Mean, Median, and Mode', body: 'The mean is the sum of all values divided by how many there are — the "average." The median is the middle value when the data is sorted in order. The mode is the value that appears most often. The median is often more useful than the mean when a data set has extreme outliers, since one huge or tiny value can pull the mean far off.' },
        { heading: 'Measuring Spread', body: 'The range (highest value minus lowest value) gives a quick but rough sense of spread. The interquartile range (IQR) measures the spread of just the middle 50% of the data, making it less sensitive to outliers than the range. Standard deviation measures, on average, how far each value sits from the mean.' },
      ],
      practice: [
        { question: 'What is the median of this data set: 4, 7, 9, 2, 5?', options: ['4', '5', '7', '9'], answerIndex: 1, explanation: 'Sorted: 2, 4, 5, 7, 9. The middle value is 5.' },
        { question: 'A data set has one extremely high outlier. Which measure is least affected by it?', options: ['Mean', 'Median', 'Range', 'Maximum'], answerIndex: 1, explanation: 'The median depends only on the middle position of sorted data, so an extreme outlier barely changes it, unlike the mean.' },
      ],
      apply: {
        prompt: 'Collect a small data set from home or family, such as the ages or shoe sizes of everyone in your household. Calculate the mean, median, mode, and range of your data set by hand.',
        checklist: ['Collected at least 5 data values', 'Calculated the mean', 'Calculated the median and mode', 'Calculated the range'],
      },
      help: {
        readings: [
          {
            title:
              'Interquartile Range vs. Standard Deviation: What’s the Difference?',
            url:
              'https://www.statology.org/interquartile-range-vs-standard-deviation/',
          },
        ],
        videos: [
          {
            title: 'Mean, Median, Mode, and Range - How To Find It!',
            url: 'https://youtu.be/A1mQ9kD-i9I?feature=shared',
          },
          {
            title:
              'Standard Deviation, Variance, Range and Interquartile Range - Measures of dispersion',
            url: 'https://youtu.be/WnMXXWWlylo?feature=shared',
          },
        ],
      },
    },
    {
      key: 'probability',
      title: 'Probability',
      grade: '6-8',
      color: '#03A9F4', // Bright sky blue
      description:
        'Calculating the likelihood of simple and compound events, using basic counting methods (permutations, combinations), and understanding theoretical vs. experimental probability.',
      learn: [
        { heading: 'Theoretical Probability', body: 'Theoretical probability predicts how likely an event is based on counting: divide the number of favorable outcomes by the total number of possible outcomes. Rolling a 4 on a fair six-sided die has a theoretical probability of 1/6, since there is 1 favorable outcome out of 6 possible ones.' },
        { heading: 'Theoretical vs. Experimental Probability', body: 'Experimental probability comes from actually running a trial many times and counting what happened, like flipping a coin 50 times and seeing how many landed heads. Experimental results won\'t always exactly match the theoretical prediction, but the more trials you run, the closer the experimental probability tends to get to the theoretical one.' },
      ],
      practice: [
        { question: 'What is the theoretical probability of rolling an even number on a fair six-sided die?', options: ['1/6', '1/3', '1/2', '2/3'], answerIndex: 2, explanation: 'There are 3 even numbers (2, 4, 6) out of 6 total outcomes, so 3/6 = 1/2.' },
        { question: 'You flip a coin 10 times and get 7 heads. This result is an example of what?', options: ['Theoretical probability', 'Experimental probability', 'An impossible event', 'A certain event'], answerIndex: 1, explanation: 'Data gathered from actually running trials is experimental probability, which can differ from the theoretical 1/2.' },
      ],
      apply: {
        prompt: 'Flip a coin 20 times and record how many times it lands heads and tails. Calculate the experimental probability of heads and compare it to the theoretical probability of 1/2.',
        checklist: ['Flipped a coin 20 times', 'Recorded the results (heads/tails count)', 'Calculated experimental probability of heads', 'Compared it to the theoretical probability and explained any difference'],
      },
      help: {
        readings: [],
        videos: [
          {
            title: 'Basic Probability',
            url: 'https://youtu.be/KzfWUEJjG18?si=Q-XZEX9GvoLzpxJ6',
          },
        ],
      },
    },
    {
      key: 'inference',
      title: 'Statistical Inference',
      grade: '9-12',
      color: '#4CAF50', // Bright green
      description:
        '(High school) Designing samples, making estimates (confidence intervals), and testing hypotheses to draw conclusions about populations from data.',
      learn: [
        { heading: 'Sampling a Population', body: 'A population is the entire group you want to know about (like all students in a school), while a sample is a smaller group you actually measure. A random sample, where every member has an equal chance of being chosen, helps avoid bias so the sample fairly represents the whole population.' },
        { heading: 'Confidence Intervals and Hypothesis Testing', body: 'A confidence interval gives a range of plausible values for a population statistic, along with a confidence level (like 95%) describing how often that method would capture the true value across repeated samples. Hypothesis testing uses sample data to decide whether there is enough evidence to reject a starting assumption about the population.' },
      ],
      practice: [
        { question: 'A researcher surveys only students in the front row of one class to represent the whole school. What is the main problem with this sample?', options: ['It is too large', 'It is not random and may be biased', 'It has too many people', 'There is no problem'], answerIndex: 1, explanation: 'Choosing only front-row students is not random and likely does not represent the whole school fairly.' },
        { question: 'A poll reports a result with a 95% confidence interval of 48% to 54%. What does this mean?', options: ['Exactly 51% of the population agrees', 'The method used would capture the true population value in about 95% of samples like this one', 'There is a 95% chance the poll is wrong', 'The sample size was 95'], answerIndex: 1, explanation: 'A confidence interval describes the reliability of the estimation method, not a guarantee about one single interval.' },
      ],
      apply: {
        prompt: 'Design a short survey question about a topic you care about. Describe a random sampling plan to fairly survey at least 15 people (avoiding bias), collect the data, and summarize your findings with a percentage.',
        checklist: ['Wrote one clear survey question', 'Described a plan to randomly select at least 15 people', 'Collected responses from real people', 'Summarized the results as a percentage and noted any possible bias'],
      },
      help: {
        readings: [],
        videos: [
          {
            title: 'Understanding Statistical Inference',
            url: 'https://youtu.be/tFRXsngz4UQ?si=vQEOTf5SdXlM9jtS',
          },
        ],
      },
    },
  ];

export default function DataStatisticsScreen() {
  return <ClassTopicScreen title={"Data, Statistics & Probability"} classKey="DataStatisticsProbability" fallbackTopics={topics} />;
}
